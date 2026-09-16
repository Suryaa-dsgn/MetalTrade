# Project Handoff — Oriental Energy and Minerals

Compact but complete context for a fresh Claude Code session. Read this first, then
only the deeper docs you actually need. Reflects the repo at commit `8e127c9`. Git
preserves history; this file describes CURRENT state only.

## Fresh session bootstrap

1. Read this handoff.
2. Read `CLAUDE.md` (agent rules, guardrails, working protocol).
3. Read the right deep doc for the task:
   - `docs/market-provider-readiness.md` — ANY market-data work (verified provider
     contracts, live/gated status, commercial terms, promotion steps).
   - `docs/lead-backend-architecture.md` — ANY Contact/lead-backend work (domain
     model, repository, idempotency, Postgres adapter, phases 2A–2F).
   - `docs/security-production-readiness.md` — ANY security/infra work (app controls
     vs infra requirements, CSP, headers, incident playbook).
   - `docs/provider-research/` — market-data provider evaluations (Yahoo rejected;
     remaining-commodity options; World Bank/IMF for iron ore + tin).
4. Read the Product Blueprint / Design System only for product-IA / visual work.
5. Read `docs/content-claims-register.md` (+ the client DOCX) for public-copy work.
6. `git log --oneline` and `git status` before editing.
7. ONE phase/task per session; PLAN first, wait for approval (per CLAUDE.md).
8. Validate (tsc, lint, test, build, responsive) and STOP for review.

## 0. Where we are RIGHT NOW (most important)

- **Branch:** `redesign/contact-us-page` — **local only, NOT pushed, NOT merged to
  `main`.** It stacks ALL work below on top of `main` (market data → security →
  images → contact redesign → lead backend). It began as
  `fix/markets-explorer-router-update-during-render` and was renamed/branched.
- **Latest commit:** `8e127c9` "Backend Phase 2C: durable PostgreSQL LeadRepository".
- **Tests: 224 passing** (Vitest). `tsc --noEmit`, `eslint` (0 warnings),
  `next build`, `secret-scan`, and `npm audit --omit=dev` (0 prod vulns) all green.
- **Big picture of what now exists** (all since the old c0868cb handoff):
  1. **Security & Reliability hardening — Phases 1–6 COMPLETE** (headers/CSP,
     provider resilience, rate limiter + bot seam, CI gates, correlation IDs, docs).
  2. **Commodity images wired** into home cards + detail pages.
  3. **CI fixed** (RootLayout typing) — GitHub Actions green on the pushed fix commit.
  4. **Provider research docs** added (Yahoo rejected; World Bank/IMF recommended
     for iron ore + tin; licensed PRAs for the rest).
  5. **Contact page fully redesigned — Phase 1 COMPLETE** (one unified form, old
     `/enquire/*` routes 308-redirect to `/contact?type=`).
  6. **Lead backend — Phases 2A, 2B, 2C COMPLETE** (domain model → in-memory →
     idempotency + production fail-closed → durable Postgres adapter).
- **Immediate open decisions for the user (nothing in-flight mid-implementation):**
  - Whether to **push the branch / open a PR** (see §11). It has never been pushed.
  - **Deploy platform** still undecided (no vercel.json/Dockerfile). Needed before
    real production activation.
  - **Postgres provisioning** for lead capture (Phase 2D activation, see §7).
  - **Email provider** selection for lead notifications (Phase 2C-email, deferred).
  - **Phase 11** (SEO/analytics/legal) still NOT started; must not auto-start.

## 1. Product (unchanged — do not drift)

Trust-first B2B website + market-intelligence portal for **Oriental Energy and
Minerals Limited (OEML)**, a **licensed mineral aggregator** (NOT a miner). The site
does NOT execute trades; it is form-first. Guardrails (from CLAUDE.md / Blueprint):
no invented prices/claims/partners/metrics, no purple, light mode default, no em
dashes in public copy, WCAG 2.2 AA, imagery only from `/public/images`, market values
always labelled and never presented as an offer.

## 2. Confirmed catalogue (12 commodities)

Gold, Copper (cathode), Lithium, Columbite-Tantalite (Coltan), Tin, Lead-Zinc,
Manganese, Rare Earth Elements, Barite, Bitumen, Iron Ore, Crude Oil. Canonical
slugs in `data/mock/metals.ts`; option lists derive from it via
`data/config/enquiry.ts` (`metalOptions`, `CATALOGUE_METAL_SLUGS`) — never hard-code a
second commodity list. Bitumen + Crude Oil are commodities, not metals.

## 3. MARKET DATA — live/sample/unavailable status (unchanged, still accurate)

Each commodity routes through **BenchmarkRegistry → ProviderRouter → adapter**.

| Commodity | Source now | Provider / benchmark | Notes |
|---|---|---|---|
| **Gold** | **LIVE** | MetalpriceAPI `XAU`, USD/troy oz, EOD | Displayed live. |
| **Crude Oil** | **LIVE** | EIA `RBRTE` (Europe Brent Spot FOB), USD/bbl | "Brent Crude reference benchmark"; public-domain → live with EIA attribution. |
| **Copper** | sample (labelled) | Metals.Dev `lme_copper`, USD/MT — verified live but display-GATED | `publicDisplayApproved:false` (commercial gate). |
| **Lithium** | sample (labelled) | MetalpriceAPI `XLI` (paid + semantic review) | Sample only. |
| **Lead-Zinc** | unavailable | `lme_lead`,`lme_zinc` in `LEAD_ZINC_BENCHMARKS` | NEVER blend into one price; catalogue not split. |
| Tin, Manganese, Iron Ore, Coltan, REE, Barite, Bitumen | unavailable ("in preparation") | — | Bitumen must NEVER map to crude. |

- Keys in untracked `.env.local`: `METALPRICE_API_KEY`, `METALS_DEV_API_KEY`,
  `EIA_API_KEY`. `MARKET_PROVIDER` unset → registry routing; `=mock` = full sample
  build (ignored in production).
- Invariant (tested): `routing:"live"` REQUIRES `publicDisplayApproved:true`.
- **No live market history** anywhere — never present synthetic history under a live
  quote. Commercial terms live in `docs/market-provider-readiness.md`, not the code.

## 4. Market architecture (files)

```
lib/market/
  benchmarks.ts   BenchmarkRegistry: BENCHMARKS + LEAD_ZINC_BENCHMARKS; routing,
                  classification, fallbackPolicy, publicDisplayApproved, units, sanityBand.
  service.ts      registry+router composition; mixed-source, PARTIAL responses first-class;
                  provider-aware min-fetch cache; single-flight; circuit breaker; bounded retry.
  normalize.ts    normalizeQuote → unit convert (mass only) + sanity guard; refuses bad data.
  units.ts, freshness.ts, meta.ts, history.ts, display.ts, filters.ts
  providers/
    types.ts, router.ts, metalpriceapi.ts, metalsdev.ts, eia.ts, mock.ts
    health.ts           per-provider health (now consulted alongside the breaker)
    single-flight.ts    coalesce(flightKey, fn) — N concurrent → 1 upstream call (Sec Phase 3)
    circuit-breaker.ts  per-provider closed→open→half-open, single probe (Sec Phase 3)
    retry.ts            withSingleRetry — one bounded jittered retry, transient only (Sec Phase 3)
    fetch-policy.ts     provider-aware min-fetch interval (Sec Phase 3)
  repository/           MarketObservationRepository (last-known-good; in-memory)
```
UI labelling is source-aware (`market-status.tsx`, `market-freshness.tsx`; pages render
`meta.sources`). Markets list = table (markets-explorer); detail = `/markets/[slug]`.

## 5. SECURITY hardening — Phases 1–6 COMPLETE (`docs/security-production-readiness.md`)

Application-level, hosting-agnostic. Infra controls (DDoS/WAF/edge rate-limit/TLS) are
documented as the host's responsibility, not built in Next.

- **P1** production hygiene: `MARKET_PROVIDER=mock` and `MARKET_SIMULATE_FAILURE`
  force-disabled in production (`lib/config/env.ts` `applyProductionHardening`);
  bounded + `.strict()` enquiry schemas; Server Action `bodySizeLimit: 64kb`; log
  sink routed through the redacting logger.
- **P2** `next.config.ts` security headers (nosniff, Referrer-Policy,
  Permissions-Policy, X-Frame-Options: DENY, `poweredByHeader:false`) +
  **CSP Report-Only** (built from real output; enforcement deferred). Policy in
  `lib/security/headers.ts`. HSTS opt-in via `SECURITY_HSTS=1` (prod only, no preload).
- **P3** provider resilience: single-flight + circuit breaker + provider-aware
  min-fetch + one bounded retry (files in `lib/market/providers/`).
- **P4** `lib/security/rate-limiter.ts` (in-memory, defense-in-depth, NOT distributed)
  on the enquiry action; `lib/security/client-identity.ts` (never trusts spoofable
  headers unless `RATE_LIMIT_TRUST_PROXY=1`); `lib/security/bot-verification.ts`
  (disabled no-op seam — no CAPTCHA/vendor code).
- **P5** CI: `.github/workflows/ci.yml` (npm ci → tsc → lint → test → build →
  secret-scan → audit:prod); `scripts/secret-scan.mjs` (`npm run secret-scan`).
- **P6** correlation IDs (`lib/observability/correlation.ts`), the security doc, and
  an incident playbook.
- **Logger:** `lib/observability/logger.ts` — single structured JSON logger with
  secret-key redaction. Never log PII, secrets, or secret-bearing URLs.

## 6. Env / config (server-only) — `lib/config/env.ts`

Zod-validated, `import "server-only"`, safe defaults; unknown values warn + fall back.
Everything runs with NO env set (dev). Secrets are `secret` fields — never logged,
never client-exposed. `.env.example` documents names/placeholders only.

| Var | Values / default | Purpose |
|---|---|---|
| `MARKET_PROVIDER` | registry \| mock (registry) | market routing; `mock` ignored in prod |
| `MARKET_SIMULATE_FAILURE` | 1/true (off) | degraded-UI QA; ignored in prod |
| `ENQUIRY_SINK` | log \| disabled (log) | legacy enquiry sink (still used by `submitEnquiry`) |
| `UPLOAD_PROVIDER` | disabled | uploads off |
| `CONTENT_SOURCE` | static | catalogue/editorial source |
| `BOT_VERIFICATION` | disabled | bot seam (no-op) |
| `RATE_LIMIT_TRUST_PROXY` | 1/true (false) | trust XFF for rate-limit identity |
| `SECURITY_HSTS` | 1 (off) | emit HSTS (prod only) |
| `LEAD_STORE` | memory \| postgres (memory) | lead persistence store |
| `DATABASE_URL` | secret | Postgres connection string (server-only) |
| `DATABASE_SSL` | require \| disable (require) | DB TLS mode |
| `METALPRICE_API_KEY`, `METALS_DEV_API_KEY`, `EIA_API_KEY` | secrets | market providers |

## 7. CONTACT PAGE + LEAD BACKEND — Phases 1, 2A–2C COMPLETE (`docs/lead-backend-architecture.md`)

**Flow:** Contact form → `submitContactEnquiry` (Server Action) → `LeadSubmissionService`
→ `LeadRepository` (memory or Postgres) → success returned ONLY after durable persist;
notification is the log provider (no email/CRM yet).

- **Contact UI (Phase 1):** `components/contact/` — `contact-page` (two-column 33/67,
  stacks on mobile), `contact-intro`, `contact-form` (one unified RHF form),
  `enquiry-type-field` (accessible radio-cards, 5 types: buy/supply/logistics/general/
  partnership), `conditional-fields` (progressive disclosure), `contact-success`
  (client copy + env-gated dev note), `use-contact-submit`. Old
  `/enquire/{supply,buying-requirement,logistics,general}` are **308 redirects** to
  `/contact?type=…`; legacy `?metal=` normalized to `?commodity=` and validated
  against the catalogue. The four old per-intent form components were DELETED.
- **Schema:** `lib/validation/enquiry.ts` `contactEnquirySchema` — bounded `.max()`,
  `.strict()`, commodity conditionally required for buy/supply. (The old per-intent
  schemas + `submitEnquiry` remain, tested, for later consolidation.)
- **Domain (2A):** `lib/leads/types.ts` — `Lead` (business data only; status
  new/contacted/qualified/closed; no correlationId, no nested notification) and a
  SEPARATE `NotificationDelivery`. `reference.ts` (internal UUID + public
  `OEML-YYYY-XXXXXX`), `normalize.ts`, `service.ts` (`submitLead`).
- **Idempotency (2B):** `lib/leads/submission-token.ts` — client generates ONE
  `crypto.randomUUID()` per submission lifecycle (kept across validation/transient
  failures/double-submit; new only for a new enquiry). Server validates it
  (UUID-shaped, bounded); logs only a fingerprint. `createOrGet` is the atomic
  idempotency op.
- **Persistence (2C):** `lib/leads/repository/` — `types.ts` (minimal
  `createOrGet` + `durability` capability + `LeadReferenceCollisionError`),
  `memory.ts` (ephemeral, dev/test), `postgres.ts` (durable; `pg`; atomic
  `INSERT … ON CONFLICT ON CONSTRAINT leads_submission_token_unique DO NOTHING
  RETURNING *`; reference clash → `23505` → `LeadReferenceCollisionError` → service
  regenerates + bounded-retries), `mapping.ts` (pure row↔Lead), `index.ts` (factory
  by `LEAD_STORE`, NO silent fallback to memory). `lib/leads/db/` — `executor.ts`
  (SqlExecutor port + unique-violation helpers), `pg-executor.ts` (server-only shared
  `pg.Pool`, TLS, fail-closed when unconfigured).
- **Fail-closed:** in production a non-durable (memory) store is rejected via the
  `durability` capability (single env check in `submitLead`); postgres-selected-but-
  unconfigured fails every query. NO lead-loss fallback.
- **Migrations:** `db/migrations/0001_create_leads.sql` (+ `.down.sql`) applied by
  `scripts/migrate.mjs` (`npm run db:migrate`) — versioned, transactional, tracked in
  `schema_migrations`; never at startup/on the request path.
- **STILL STUBBED:** notification is log-only (no email/CRM). Success state shows an
  env-gated dev note that leads are in-memory only. `submitLead` accepts a
  server-generated token today; the form already sends a client token via the hook.

**Production lead capture is NOT live.** To activate (Phase 2D — needs approval +
infra): provision Postgres → `npm run db:migrate` → set server-only `DATABASE_URL`
(+ `DATABASE_SSL=require`) → `LEAD_STORE=postgres` → confirm TLS → smoke test. Until
then production fails closed.

## 8. Provider research (docs/provider-research/)

- `yahoo-finance-readiness.md` — **Yahoo REJECTED** for public production (no
  redistribution rights; only futures tickers ≠ our spot/LME/EIA benchmarks).
- `remaining-commodity-provider-research.md` — for the unresolved commodities:
  **Iron Ore + Tin → World Bank/IMF monthly (free, CC BY, redistribution-legal)**;
  Lithium/REE/Manganese/Barite/Bitumen/Coltan → licensed PRAs (Fastmarkets/Benchmark/
  Argus). API access ≠ public-display rights (three separate rights).
- Provider decision summary is also in `docs/market-provider-readiness.md`.

## 9. Stack & conventions

Next.js 16 App Router, React 19, TS, Tailwind v4 tokens, Base UI + CVA, Heroicons
(chrome) + Phosphor `regular` (domain), Recharts, RHF + Zod (direct dep). **Vitest**
(`npm test`, node env, `lib/**/*.test.ts`) with a `server-only` stub in
`test/vitest-stubs/`; no DOM/RTL setup (component behavior verified via browser QA +
pure-logic tests). DB deps: **`pg`** (prod), **`@electric-sql/pglite`** +
**`@types/pg`** (dev — in-process Postgres for integration tests, no infra). Server
Components by default; `"use client"` only where needed. `cn` via `createCn` (do not
revert — button text colour). No em dashes in public copy. Windows dev; git shows
LF→CRLF warnings (harmless).

## 10. Completed work on this branch (newest first)

```
8e127c9 Backend Phase 2C: durable PostgreSQL LeadRepository
33fe19d Backend Phase 2B: idempotency + production ephemeral-store safety
48f48de Backend Phase 2A: in-memory lead pipeline behind submitContactEnquiry
3ab66ab Contact Phase 1 cleanup: preserve commodity prefill in unified form
dc34d35 Contact redesign Phase 1: unified front-end Contact page
a767b87 docs: provider-research reports + provider decision summary
5a18f42 Fix CI: use explicit RootLayout props shape
1bae26e Wire client-supplied commodity images into cards + detail pages
6dbb9de Security Phase 6 · 4d736fd Phase 5 · 05aeccc Phase 4
2491563 Security Phase 3 · b46ad46 Phase 2 · 6465b1e Phase 1
5c38d81 docs handoff refresh · c0868cb…0d74f25 market-data phases (A→D2)
```

## 11. Pending / next steps (nothing mid-implementation)

- **Push + PR** (user decision): `git push -u origin redesign/contact-us-page`, then
  open a PR to `main`. CI runs automatically on push. Never pushed yet.
- **Backend Phase 2D — activate Postgres** (needs platform + DB + approval): see §7
  checklist. This flips production from fail-closed to live lead capture.
- **Backend Phase 2C-email / 2E / 2F** (deferred): real email adapter behind the
  neutral notification seam (SES vs Resend, decided with hosting/domain/inbox);
  notification retry (bounded sync + durable `pending`); CRM adapter; admin
  read/query interfaces. Do NOT start without approval.
- **Phase 11 — SEO, analytics, legal**: metadata/OpenGraph, sitemap, robots,
  canonical, structured data, consent-aware PII-free analytics, and the legal pages
  (`/privacy` `/terms` `/cookies` `/accessibility` — footer links exist, routes do
  NOT). NOT started; gated on go-ahead. (CSP `connect-src` will need the analytics
  domain when chosen.)
- **CSP enforcement** (flip Report-Only → enforced) is a separate approved step;
  strict nonce-based `script-src` needs middleware (deferred).
- **Phase 12 — final QA.** Client-dependent: cleared imagery is now supplied for all
  12; resolve any pending claim clarifications (`docs/content-claims-register.md`).

## 12. Things the next agent must NOT do

- Do not push/merge the branch or start Phase 11 / email / CRM / a real DB
  connection without being asked.
- Do not add Redis/KV/queues/microservices, build custom DDoS in Next, enforce CSP,
  enable HSTS preload, or guess the deploy platform — all need approval.
- Do not let a non-durable store serve production, or add a silent
  postgres→memory fallback (both reintroduce lead-loss). Keep fail-closed.
- Do not display Metals.Dev Copper/Lead/Zinc live (commercial gate), blend Lead-Zinc,
  map Bitumen to crude, present synthetic history under a live quote, or invent
  prices/claims.
- Do not log secrets, provider URLs, DATABASE_URL, or enquiry/lead PII; keep keys and
  DB code out of the client bundle. Do not revert the `cn` font-size config.
- Do not weaken security (bounded/strict schemas, rate limiter, bot seam, redaction,
  headers) or the existing 224 tests. Assume `crypto.randomUUID` (no UUID npm dep).
- Do not redesign the Contact page visually or change product behaviour except where a
  requested phase requires it.

## 13. How to run / validate

`npm run dev` (dev server) · `npm test` (224, node, no external DB) · `npx tsc
--noEmit` · `npm run lint` · `npm run build` · `npm run secret-scan` (after build) ·
`npm run audit:prod` · `npm run db:migrate` (needs `DATABASE_URL`). Validate at 375 /
768 / 1024 / 1440 for responsive work.
