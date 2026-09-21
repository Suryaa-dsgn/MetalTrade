# Oriental Energy and Minerals (OEML) Portal

A trust-first **B2B physical minerals & commodities trading and market-intelligence
portal** for Oriental Energy and Minerals Limited, a licensed mineral aggregator.
The company sources physical commodities from reviewed suppliers and coordinates
inspection, freight, and origin logistics to vetted corporate and institutional
buyers; suppliers and buyers are not introduced to each other.

This is **not** an e-commerce or checkout platform. The site does not execute
trades. It exists to establish credibility, explain the operating model and
logistics boundaries, present labelled market benchmarks, and capture structured
supplier / buyer / logistics enquiries. It is form-first: there is no public
bidding, cart, wallet, payments, settlement, or authenticated trading dashboard.

> Product behaviour and visual decisions are governed by the documents in `docs/`
> and by [`CLAUDE.md`](CLAUDE.md). Never invent prices, volumes, partners,
> certifications, or other business facts; sample market data is always labelled.

## Tech stack

Detected from `package.json` / `package-lock.json` (npm is the package manager):

- **Next.js 16** (App Router) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** (`@tailwindcss/postcss`) with semantic CSS-variable tokens; light mode is the default
- **Base UI** (`@base-ui/react`) primitives, `class-variance-authority` for variants, `cn` for class merging
- **Recharts** for price / history charts
- **React Hook Form** + `@hookform/resolvers` + **Zod 4** for forms and validation
- **Heroicons** (UI chrome) and **Phosphor Icons** (`regular`, domain/editorial), each behind a thin barrel
- **Resend** (`resend`) for transactional enquiry email
- **PostgreSQL** via `pg` (dormant durable lead store; `@electric-sql/pglite` powers in-process DB integration tests)
- `server-only` to keep provider config and secrets out of the client bundle
- **Vitest 3** for tests · **ESLint 9** (`eslint-config-next`)

## Architecture

A **modular monolith**: one Next.js App Router application with domain logic
organised behind provider-agnostic seams, so a provider can be swapped without
touching pages. Server Components are the default; `"use client"` is used only
where interaction requires it (forms, chart interaction, mobile nav, local UI).

- **Market data** — commodities route through a `BenchmarkRegistry` → `ProviderRouter`
  → provider adapter (`lib/market/`). The read service (`lib/market/service.ts`) adds
  caching, per-feed freshness, single-flight, a circuit breaker, bounded retry, and
  last-known-good failover, returning a small `ReadMeta` (provider, source, degraded,
  safe error code) and never leaking raw errors to the client. Sample data is always
  labelled indicative / not live. See [Market data](#market-data).
- **Enquiries / email** — the Contact form (React Hook Form + Zod) posts to a Server
  Action that re-validates with the same Zod schema, then hands off to an email sink
  that delivers the lead to the trade-desk inbox via Resend (`lib/enquiries/`,
  `lib/leads/notification/email/`). The current live flow is **email-only (no
  database)**. A durable Postgres "outbox" (`lib/leads/`, `db/migrations/`) is built
  but **dormant** — off the live path until provisioned. See [Enquiry & email](#enquiry--email).
- **Content** — catalogue and per-metal editorial come through a `ContentSource`
  seam (`lib/content/`), static in-repo today, chosen by `CONTENT_SOURCE`.
- **Uploads** — `lib/uploads/` is a disabled seam (no storage, no endpoint); the
  attachment UI is a non-uploading shell.
- **Security & observability** — hosting-agnostic HTTP security headers + CSP
  (Report-Only), an app-level rate limiter, a bot-verification no-op seam, a
  redacting structured logger, and correlation IDs (`lib/security/`,
  `lib/observability/`, `next.config.ts`). See [Security & production readiness](#security--production-readiness).

### Directory map

```
app/            App Router routes (home, markets, company, trade-logistics,
                contact, enquire/*) + app/api/internal (notification drain)
components/     ui/ (primitives + icon barrels), brand/, layout/, editorial/,
                market/, trade/, company/, contact/, forms/
lib/            market/ (registry, router, providers, service, repository)
                enquiries/ + leads/ (enquiry flow, email delivery, dormant outbox)
                content/  uploads/  validation/ (Zod)  config/ (server-only env)
                security/  observability/  assets/  formatters/  accessibility/
data/           config/ (typed site/editorial content) · mock/ (labelled fixtures)
db/migrations/  SQL migrations for the dormant durable lead store
docs/           source-of-truth product/design docs + engineering references
scripts/        secret-scan, migrate, email-test (Node CLI utilities)
public/         imagery (public/images) and brand logo assets (public/Logo)
```

## Local development

**Prerequisites:** Node.js 20+ (LTS) and npm. Use npm — the repo is locked with
`package-lock.json`; do not mix package managers.

```bash
npm install          # install dependencies
npm run dev          # start the dev server at http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
```

The app runs with **no environment configured** — every integration defaults to a
mock / static / disabled provider. Add secrets only to an untracked `.env.local`
(see [Environment variables](#environment-variables)); the dev server reads
`.env.local` at process start, so **restart it** after adding a key.

## npm scripts

Only the scripts that actually exist in `package.json`:

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Start the dev server |
| `npm run build` | `next build` | Production build (also type-checks) |
| `npm run start` | `next start` | Serve the production build |
| `npm run lint` | `eslint` | Lint |
| `npm test` | `vitest run` | Run the test suite once |
| `npm run test:watch` | `vitest` | Tests in watch mode |
| `npm run secret-scan` | `node scripts/secret-scan.mjs` | Scan for accidentally committed secrets |
| `npm run audit:prod` | `npm audit --omit=dev` | Audit production dependencies |
| `npm run db:migrate` | `node scripts/migrate.mjs` | Apply DB migrations (needs `DATABASE_URL`; dormant store) |
| `npm run email:test` | `node scripts/email-test.mjs` | Dev-only Resend smoke test (refuses `NODE_ENV=production`) |

Type-checking is run directly with `npx tsc --noEmit`.

## Environment variables

Variable **names only** — never commit real values. Secrets are read server-side
only (`lib/config/env.ts`, `import "server-only"`) and belong in an untracked
`.env.local`. `.env.example` documents every supported selector with placeholders.
Selectors are validated against explicit enums; an unknown value warns and falls
back to the safe default. The app runs fully with none of these set.

**Integration selectors** (with defaults):

| Variable | Values (default) | Notes |
|---|---|---|
| `MARKET_PROVIDER` | `registry` \| `mock` (`registry`) | Per-benchmark routing; `mock` is ignored in production |
| `ENQUIRY_SINK` | `log` \| `disabled` (`log`) | Legacy enquiry sink; `log` records redacted metadata only |
| `UPLOAD_PROVIDER` | `disabled` (`disabled`) | Uploads are off |
| `CONTENT_SOURCE` | `static` (`static`) | Catalogue / editorial source |
| `MARKET_SIMULATE_FAILURE` | `1`/`true` (off) | Dev-only degraded-UI QA; ignored in production |

**Market provider secrets** (enable live benchmarks):

| Variable | Required for |
|---|---|
| `METALPRICE_API_KEY` | Gold (MetalpriceAPI) live quote |
| `EIA_API_KEY` | Brent Crude (EIA) latest + history |
| `METALS_DEV_API_KEY` | Copper / Lead / Zinc (Metals.Dev; display-gated) |

**Enquiry email (current live lead flow — Resend):**

| Variable | Values (default) | Notes |
|---|---|---|
| `RESEND_API_KEY` | secret | Required to send enquiry email |
| `ENQUIRY_EMAIL_FROM` | string | Verified Resend sender (From) — required to send |
| `ENQUIRY_EMAIL_TO` | string | Trade-desk recipient (To), a single address — required to send |
| `ENQUIRY_EMAIL_REPLY_TO_MODE` | `lead-email` \| `none` (`lead-email`) | Put the submitter's validated email in Reply-To (never From/To) |

**Dormant durable-lead / outbox stack** (only when re-activating persistence):
`LEAD_STORE` (`memory`\|`postgres`), `DATABASE_URL`, `DATABASE_SSL`
(`require`\|`disable`), `EMAIL_PROVIDER` (`none`\|`resend`\|`ses`), `EMAIL_FROM`,
`EMAIL_TO`, `EMAIL_REPLY_TO`, `NOTIFICATION_DRAIN_SECRET`.

**Security:** `BOT_VERIFICATION` (`disabled`), `RATE_LIMIT_TRUST_PROXY`
(`1`/`true` to trust `X-Forwarded-For`), `SECURITY_HSTS` (`1` to enable HSTS in
production; the edge usually owns HSTS).

## Market data

Provider-agnostic by design: each commodity is mapped in the `BenchmarkRegistry`
to a benchmark, unit, sanity band, and routing/display classification; the
`ProviderRouter` picks the adapter. Live routing requires public-display approval,
so a verified-but-gated feed still renders as labelled sample data.

Current state (see `docs/market-provider-readiness.md` for the authoritative,
dated record):

- **Live:** Gold (MetalpriceAPI), Brent Crude (EIA — latest quote plus real
  1M / 3M / 1Y daily history).
- **Verified but display-gated (shown as labelled sample):** Copper / Lead / Zinc
  via Metals.Dev.
- **In preparation:** the remaining catalogue commodities (no fabricated prices).

Adapter tests mock `fetch` with captured payloads, so tests are deterministic and
consume no API quota.

## Enquiry & email

The live flow is **email-only, with no database**: a submitted enquiry is
re-validated server-side, normalised in memory, and delivered to the trade-desk
inbox via Resend. Success is returned only after Resend accepts the message. The
submitter's email may become **Reply-To** (never From/To); there is no CC/BCC and
no customer auto-reply.

To send, set `RESEND_API_KEY`, `ENQUIRY_EMAIL_FROM`, and `ENQUIRY_EMAIL_TO`.
Without them the sink is **unavailable in production (fails closed)** and falls
back to a **dev log sink that returns success without sending** in development.
Use `npm run email:test` for a dev-only smoke test. Full detail (including the
dormant durable outbox and how to re-activate persistence) is in
`docs/lead-backend-architecture.md`.

## Testing & validation

Run these before opening a PR:

```bash
npx tsc --noEmit     # type-check
npm run lint         # eslint (target: zero warnings)
npm test             # vitest (lib/**/*.test.ts, node env, no external DB or live APIs)
npm run build        # production build
```

Optional: `npm run secret-scan` (after a build) and `npm run audit:prod`. Validate
responsive behaviour at 375 / 768 / 1024 / 1440.

## Security & production readiness

Application-level controls live in this repo (security headers + CSP Report-Only,
rate limiting, bot-verification seam, redacting logger, correlation IDs, strict
bounded Zod schemas, Server Action body limit). Infrastructure controls (TLS,
WAF/DDoS, authoritative rate limiting, secret management) are the hosting
platform's responsibility. See **`docs/security-production-readiness.md`** for the
full threat model and the application/infrastructure split.

## Deployment

The hosting platform is intentionally undecided; nothing hard-codes a vendor.
**Environment variables are configured in the hosting platform, never committed to
Git.** In production (`NODE_ENV=production`) unconfigured integrations fail closed
(e.g. enquiry email is unavailable rather than silently "succeeding", and
`MARKET_PROVIDER=mock` / `MARKET_SIMULATE_FAILURE` are ignored). Live providers,
email, storage, and any database are connected only after explicit approval and
setting the matching secrets on the host. See `docs/build-runbook.md`.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — agent rules, guardrails, and working protocol
- [`docs/project-handoff.md`](docs/project-handoff.md) — current-state engineering handoff
- [`docs/security-production-readiness.md`](docs/security-production-readiness.md) — security & production readiness
- [`docs/market-provider-readiness.md`](docs/market-provider-readiness.md) — verified market providers, live/gated status, terms
- Also useful: `docs/build-runbook.md`, `docs/lead-backend-architecture.md`,
  `docs/content-claims-register.md`, and the product blueprint + design system
  (`docs/physical-metals-trading-platform-ux-product-blueprint.md`,
  `docs/metal-trading-portal-design-system.md`) — the product/visual source of truth.

## Git workflow

The **company repository is the primary repository**:

```
origin  → https://github.com/Digital-Exchange-LLC/Oriental-Energy-and-Minerals-Ltd_Dev.git
```

`main` tracks `origin/main`. Create feature branches from an up-to-date `main`:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feature/<short-name>
# …work, commit…
git push -u origin feature/<short-name>   # open a PR into main
```

A commit stays local until you explicitly push, and a normal `git push` on `main`
goes to `origin` (the company repo). A separate `personal` remote
(`Suryaa-dsgn/MetalTrade`) exists only as a historical backup and is not the
project's source of truth.
