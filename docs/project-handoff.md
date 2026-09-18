# Project Handoff — Oriental Energy and Minerals

Compact but complete context for a fresh Claude Code session. Read this first, then
only the deeper docs you actually need. Reflects the repo at commit `0542062`. Git
preserves history; this file describes CURRENT state only.

## Fresh session bootstrap

1. Read this handoff.
2. Read `CLAUDE.md` (agent rules, guardrails, working protocol).
3. Read the right deep doc for the task:
   - `docs/market-provider-readiness.md` — ANY market-data work (verified provider
     contracts, live/gated status, commercial terms).
   - `docs/lead-backend-architecture.md` — ANY Contact/lead/email work. §24 is the
     CURRENT live flow (email-only, no DB); §1–§23 describe the DORMANT durable
     outbox (still in the repo, not on the live path).
   - `docs/phase-2e-durable-notification-delivery-design.md` — the durable
     notification/drain design (dormant; reference if re-activating persistence).
   - `docs/security-production-readiness.md` — security/infra controls.
   - `docs/provider-research/` — market-data provider evaluations.
4. Read the Product Blueprint / Design System only for product-IA / visual work.
5. Read `docs/content-claims-register.md` (+ the client DOCX) for public-copy work.
6. `git log --oneline` and `git status` before editing.
7. ONE phase/task per session; PLAN first, wait for approval (per CLAUDE.md).
8. Validate (tsc, lint, test, build) and STOP for review.

## 0. Where we are RIGHT NOW (most important)

- **Branch:** `redesign/contact-us-page` — **pushed to `origin`
  (github.com/Suryaa-dsgn/MetalTrade), NOT merged to `main`.** It stacks ALL work on
  top of `main`. CI (GitHub Actions `.github/workflows/ci.yml`) runs on every push and
  is **green** (latest run on `0542062` = success). No PR has been explicitly opened by
  the agent; the branch is simply pushed.
- **Latest commit:** `0542062` "fix: correct live market chart provenance labels".
- **Tests: 384 passing** (Vitest). `tsc --noEmit`, `eslint` (0 warnings), `next build`,
  `secret-scan`, `npm audit --omit=dev` (0 prod vulns) all green.
- **What now exists since the old `8e127c9` handoff (newest work first):**
  1. **Live enquiry email via Resend — THIS IS THE CURRENT LEAD FLOW.** The Contact
     form emails the full lead to the client inbox. **NO database.** See §7.
  2. **EIA Brent historical chart data — LIVE.** Crude Oil detail chart renders real
     RBRTE daily history (1M/3M/1Y). See §3.
  3. **Chart provenance labels fixed** — live charts show the real benchmark + source;
     only sample data shows the "indicative sample" note. See §3.
  4. **Durable notification delivery (Phases 2D, 2E-1/2E-2/2E-3) built then left
     DORMANT** — outbox table, drain endpoint, Resend transport. Not on the live path.
     See §7.
  5. **Logger severity fixed** — warn→`console.warn`, error→`console.error`.
  6. **Contact success UI** — the dev-only "in memory only" note was removed
     (commit `130e609`); success shows only the two client-facing lines.
- **Immediate open decisions for the user:**
  - **Production email activation:** client must own the Resend account, verify the
    OEML sending domain (SPF/DKIM/DMARC), and set `RESEND_API_KEY` + `ENQUIRY_EMAIL_*`
    on the host (see §7). Until then production email fails closed.
  - **Deploy platform:** Vercel is the working assumption (GitHub repo + Actions), but
    no `vercel.json`/Dockerfile is committed. On Vercel both Preview and Production run
    `NODE_ENV=production` (fail-closed email without config — see §7/§12).
  - **REE / Coltan / Barite card redesign** — the user's likely NEXT task. NOT started.
  - Whether to open a PR / merge to `main` (never merged).
  - Durable lead storage (Postgres) is BUILT but dormant; provision only if the client
    wants retained lead history / CRM (see §7). Not needed for the current email flow.
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
slugs in `data/mock/metals.ts` (crude is `crude-oil`); option lists derive from it via
`data/config/enquiry.ts` — never hard-code a second commodity list. Bitumen + Crude Oil
are commodities, not metals.

## 3. MARKET DATA — live/sample/unavailable status

Each commodity routes through **BenchmarkRegistry → ProviderRouter → adapter**
(`lib/market/`). Registry is the single source of truth (`lib/market/benchmarks.ts`).

| Commodity | Source now | Provider / benchmark | Notes |
|---|---|---|---|
| **Gold** | **LIVE** | MetalpriceAPI `XAU`, USD/troy oz, EOD | Displayed live. |
| **Crude Oil** | **LIVE + HISTORY** | EIA `RBRTE` (Europe Brent Spot FOB), USD/bbl | Latest price + real daily history chart (1M/3M/1Y). |
| **Copper** | sample (labelled) | Metals.Dev `lme_copper`, USD/MT — verified live but display-GATED | `publicDisplayApproved:false`. |
| **Lithium** | sample (labelled) | MetalpriceAPI `XLI` | Sample only. |
| **Lead-Zinc** | unavailable | `lme_lead`,`lme_zinc` | NEVER blend into one price. |
| Tin, Manganese, Iron Ore, Coltan, REE, Barite, Bitumen | unavailable ("in preparation") | — | Bitumen must NEVER map to crude. |

- Keys in untracked `.env.local`: `METALPRICE_API_KEY`, `METALS_DEV_API_KEY`,
  `EIA_API_KEY`. `serverConfig` reads env ONCE at import — a running server must be
  RESTARTED to pick up a newly-added key (Next loads `.env.local` at process start; HMR
  does not reload it).
- Invariant (tested): `routing:"live"` REQUIRES `publicDisplayApproved:true`.
- **EIA Brent history (LIVE):** `eiaProvider.getHistory` +
  `marketService.getBenchmarkHistory(slug, range)`. Ranges 1M/3M/1Y → 30/90/365-day
  windows; EIA query `frequency=daily, facets[series][]=RBRTE, start, end, sort period
  asc`. Validates each row (series RBRTE, unit `$/BBL`→`bbl`, numeric>0, valid date),
  skips malformed/weekend rows (no fabrication), ascending. **Dedicated 15s history
  timeout** (latest quote unchanged at 8s). Per-range cache (separate key per
  `benchmarkId:range`), single-flight, one bounded retry, last-known-good; history
  failure NEVER removes the latest price (`getMetalDetail` keeps price, chart shows
  "Historical data temporarily unavailable."). `crude-oil` has a detail-content entry
  in `data/mock/metal-details.ts` (placeholder specs + general educational facts).
- **Chart provenance labels (fixed):** `components/market/{price-chart,chart-data-table,
  market-statistics,metal-market-panel}.tsx` + `app/markets/[slug]/page.tsx` are
  parametrized by `provenance`. Live → real benchmark name + attribution (e.g. "Brent
  Crude reference benchmark · Source: U.S. Energy Information Administration"); only
  `quote.source==="sample"` shows the "indicative sample data" note. NO hard-coded
  Copper/sample labels remain on live charts.
- **No live market history for any other commodity.** Copper uses labelled SAMPLE
  history (deterministic fixture) only because it is displayed as sample.

## 4. Market architecture (files)

```
lib/market/
  benchmarks.ts   BenchmarkRegistry: routing, classification, publicDisplayApproved, units, sanityBand.
  service.ts      registry+router composition; caching, single-flight, breaker, retry;
                  getMetalDetail; getBenchmarkHistory (live history, per-range cache, LKG).
  normalize.ts, units.ts, freshness.ts, meta.ts, history.ts (sample fixture), display.ts
  providers/
    types.ts (BenchmarkProvider + getHistory), router.ts, metalpriceapi.ts, metalsdev.ts,
    eia.ts (getLatest + getHistory), mock.ts (sample), health.ts, single-flight.ts,
    circuit-breaker.ts, retry.ts, fetch-policy.ts
  repository/     MarketObservationRepository (last-known-good; in-memory)
```

## 5. SECURITY hardening — Phases 1–6 COMPLETE (`docs/security-production-readiness.md`)

Application-level, hosting-agnostic. Unchanged this cycle except the logger sink fix.

- **P1** production hygiene (`MARKET_PROVIDER=mock`/`MARKET_SIMULATE_FAILURE`
  force-disabled in prod); bounded `.strict()` enquiry schemas; Server Action body
  limit; redacting logger. **P2** security headers + CSP Report-Only
  (`lib/security/headers.ts`, `next.config.ts`). **P3** provider resilience
  (single-flight, breaker, min-fetch, one retry). **P4** in-memory rate limiter +
  client-identity + disabled bot seam. **P5** CI + `scripts/secret-scan.mjs`. **P6**
  correlation IDs + incident playbook.
- **Logger** (`lib/observability/logger.ts`): single structured JSON logger, secret-key
  redaction. Routing FIXED — `error→console.error`, `warn→console.warn`,
  `info/debug→console.log` (warnings no longer trigger the Next.js dev error overlay).
  Never log PII, secrets, or secret-bearing URLs.

## 6. Env / config (server-only) — `lib/config/env.ts`

Zod-validated, `import "server-only"`, safe defaults; unknown enum values warn + fall
back (never throw). `serverConfig` is evaluated ONCE at import. Secrets are `secret`
fields — never logged, never client-exposed. `.env.example` documents names/placeholders.

| Var | Values / default | Purpose |
|---|---|---|
| `MARKET_PROVIDER` | registry \| mock (registry) | market routing; `mock` ignored in prod |
| `MARKET_SIMULATE_FAILURE` | 1/true (off) | degraded-UI QA; ignored in prod |
| `METALPRICE_API_KEY`, `METALS_DEV_API_KEY`, `EIA_API_KEY` | secrets | market providers |
| `ENQUIRY_SINK` | log \| disabled (log) | legacy `submitEnquiry` sink (not the live Contact path) |
| **`RESEND_API_KEY`** | secret | **Resend key — required for live enquiry email** |
| **`ENQUIRY_EMAIL_FROM`** | optional string | verified Resend sender (From). Required to send |
| **`ENQUIRY_EMAIL_TO`** | optional string | trade-desk recipient (To), SINGLE address. Required to send |
| **`ENQUIRY_EMAIL_REPLY_TO_MODE`** | lead-email \| none (lead-email) | put submitter email in Reply-To (never From/To) |
| `EMAIL_PROVIDER` | none \| ses \| resend (none) | DORMANT outbox transport selector (not the live enquiry path) |
| `EMAIL_FROM` / `EMAIL_TO` / `EMAIL_REPLY_TO` | optional / disabled | DORMANT outbox addresses |
| `NOTIFICATION_DRAIN_SECRET` | secret | guards the (unwired) drain endpoint; unset → endpoint 401s |
| `LEAD_STORE` | memory \| postgres (memory) | DORMANT lead persistence store |
| `DATABASE_URL` / `DATABASE_SSL` | secret / require | DORMANT Postgres connection |
| `BOT_VERIFICATION` | disabled | bot seam (no-op) |
| `RATE_LIMIT_TRUST_PROXY` | 1/true (false) | trust XFF for rate-limit identity |
| `UPLOAD_PROVIDER` / `CONTENT_SOURCE` | disabled / static | uploads off; static content |

## 7. CONTACT / LEAD / EMAIL — CURRENT LIVE FLOW is EMAIL-ONLY (no database)

**This is the most important architectural fact.** Full detail:
`docs/lead-backend-architecture.md` §24.

**Live flow:**
```
Contact form (unchanged UX)
  → submitContactEnquiry (Server Action, lib/enquiries/actions.ts)
    → rate limit + bot seam + correlation ID + bounded/strict Zod re-validation
    → submissionToken validated (UUID-shaped) → used as Resend idempotency key
    → buildLead(...) normalizes to a Lead-shaped object IN MEMORY (NOT persisted)
    → ContactEnquiryEmailSink.deliver(lead)  (lib/enquiries/email/sink.ts)
        → buildLeadEmail → Resend (lib/leads/notification/email/transports/resend.ts)
    → success returned ONLY after Resend accepts; referenceId = lead.reference
```
- **There is NO persistent lead store on the live path.** The client inbox is the lead
  destination. If a notification email is lost, the app retains no lead history.
- **Sink selection** (`getContactEnquiryEmailSink`): `RESEND_API_KEY` +
  `ENQUIRY_EMAIL_FROM` + `ENQUIRY_EMAIL_TO` all set → **Resend sink**; unconfigured +
  production → **unavailable** (fail closed; user sees a generic failure; NEVER a fake
  success); unconfigured + development → **dev log sink** (returns ok WITHOUT sending).
- **From/To** come only from server config; the submitter email may become **Reply-To**
  (mode `lead-email`), never From/To. **Single recipient only** (`ENQUIRY_EMAIL_TO` is
  passed verbatim; no comma-splitting).
- **Resend SDK:** `resend` ^6.28.1. Transport declares `capabilities.idempotentSend`,
  forwards the idempotency key, classifies errors (4xx→permanent, 5xx/429/rate/quota→
  temporary), returns a provider message id on success. Shared bounded `sendWithTimeout`.
- **Email content** (`lib/leads/notification/email/content.ts`): subject names the
  enquiry type (e.g. "New OEML Supply Enquiry — Copper"); plain-text + email-safe HTML
  grouped ENQUIRY / CONTACT / REQUIREMENT; every lead value HTML-escaped; renders only
  present fields; no remote images/JS/tracking. **No customer auto-reply** (internal
  notification only). PII never logged.
- **Dev smoke test:** `npm run email:test` (`scripts/email-test.mjs`) sends one labelled
  test email using env config; refuses `NODE_ENV=production`; never prints the key.

**DORMANT durable outbox (Phases 2A–2E, in the repo, NOT on the live path):**
`lib/leads/{service,unit-of-work,normalize,reference,submission-token}.ts`,
`lib/leads/repository/*` (memory + Postgres + factory, fail-closed),
`lib/leads/notification/delivery/*` (delivery types/repo/backoff/first-attempt/drain +
`drain.factory.ts`), `lib/leads/db/*`, `db/migrations/0001_create_leads.sql` +
`0002_create_lead_notification_deliveries.sql`, `scripts/migrate.mjs`
(`npm run db:migrate`), and the protected route
`app/api/internal/notifications/drain/route.ts` (guarded by `NOTIFICATION_DRAIN_SECRET`;
NO platform scheduler is wired). This is the intended home for a future
`DatabaseLeadSink` / CRM behind the same seam — the Contact form/action would not
change. It is fully tested but inert until re-activated.

**To activate durable lead capture later (needs approval + infra):** provision Postgres
→ `npm run db:migrate` → set `DATABASE_URL`/`DATABASE_SSL=require`/`LEAD_STORE=postgres`
→ re-point `submitContactEnquiry` at the outbox (or add a DB sink alongside the email
sink) → wire a scheduler to the drain route.

## 8. Provider research (`docs/provider-research/`)

- Yahoo REJECTED for public production (no redistribution rights).
- Iron Ore + Tin → World Bank/IMF monthly (free, CC BY). Lithium/REE/Manganese/Barite/
  Bitumen/Coltan → licensed PRAs (Fastmarkets/Benchmark/Argus). API access ≠
  public-display rights.

## 9. Stack & conventions

Next.js 16 App Router, React 19, TS, Tailwind v4 tokens, Base UI + CVA, Heroicons
(chrome) + Phosphor `regular` (domain), Recharts, RHF + Zod. **Vitest** (`npm test`,
node env, `lib/**/*.test.ts`) with a `server-only` stub in `test/vitest-stubs/`; no
DOM/RTL (components verified via browser QA + pure-logic tests). Deps: **`resend`**
(email), **`pg`** (dormant Postgres), **`@electric-sql/pglite`** + **`@types/pg`** (dev,
in-process Postgres for integration tests — no infra). Server Components by default;
`"use client"` only where needed. No em dashes in public copy. Windows dev; git shows
LF→CRLF warnings (harmless).

## 10. Completed work on this branch (newest first)

```
0542062 fix: correct live market chart provenance labels (+ EIA history 15s timeout + logger fix)
9422239 feat: add EIA Brent historical market data
7017fc7 feat: add Resend-only enquiry email delivery   ← current live lead flow (no DB)
130e609 cleanup (remove dev-only success note)
de0342e feat: add Resend email transport (real provider activation)
90c04ff feat: add durable notification drain and recovery      (2E-3, dormant)
2ae2192 feat: persist first notification attempt outcomes       (2E-2, dormant)
f4617fe feat: add durable notification outbox foundation        (2E-1, dormant)
105555e feat: add email notification foundation                 (2D, dormant)
8e127c9 Backend Phase 2C: durable PostgreSQL LeadRepository      (dormant)
… (2A/2B, contact redesign, security, market phases below)
```

## 11. Pending / next steps

- **REE / Coltan / Barite card redesign** — user's likely next task. NOT started; do
  not start without the plan being approved.
- **Production email activation** (client-dependent): client-owned Resend account +
  verified OEML sending domain (SPF/DKIM/DMARC) + `RESEND_API_KEY`/`ENQUIRY_EMAIL_FROM`/
  `ENQUIRY_EMAIL_TO` set on the host. Rotate any developer key at handover. Consider a
  separate `ENQUIRY_EMAIL_TO` for Vercel Preview so previews don't email the live desk.
- **Deploy platform / PR / merge** (user decision): Vercel assumed but not committed;
  branch pushed, CI green, not merged; no PR opened by the agent.
- **Durable lead storage / CRM** (optional, approval-gated): re-activate the dormant
  outbox (§7) if retained lead history is wanted.
- **Phase 11 — SEO, analytics, legal**: metadata/OpenGraph, sitemap, robots, canonical,
  structured data, consent-aware analytics, legal pages (`/privacy` `/terms` `/cookies`
  `/accessibility` — footer links exist, routes do NOT). NOT started; gated.
- **CSP enforcement** (Report-Only → enforced) — separate approved step.
- **Phase 12 — final QA** — client-dependent.

## 12. Things the next agent must NOT do

- Do not merge the branch, open a PR, start Phase 11 / a real DB connection, or start
  the REE/Coltan/Barite redesign without being asked.
- Do not let a Vercel deployment appear to send email when it cannot: the dev **log
  sink returns success WITHOUT sending**, but only when `NODE_ENV !== "production"`.
  Vercel forces `NODE_ENV=production`, so unconfigured deployments fail closed
  (unavailable sink). Never make email "succeed" in production without a real send.
- Do not use the submitter's email as From/To (only Reply-To). Do not add CC/BCC.
- Do not display Metals.Dev Copper/Lead/Zinc live (commercial gate), blend Lead-Zinc,
  map Bitumen to crude, present synthetic history under a live quote, or invent
  prices/claims. Do not re-introduce hard-coded Copper/sample chart labels.
- Do not log secrets, provider URLs, `RESEND_API_KEY`, `DATABASE_URL`, or enquiry/lead
  PII; keep keys and DB/email code out of the client bundle. Assume `crypto.randomUUID`.
- Do not revert the logger sink routing (warn→console.warn) or route warnings through
  console.error. Do not globally widen provider timeouts (EIA history is 15s, latest 8s).
- Do not weaken security (bounded/strict schemas, rate limiter, bot seam, redaction,
  headers) or break the 384 tests.
- Do not redesign the Contact page UX or change product behaviour except where a
  requested phase requires it.

## 13. How to run / validate

`npm run dev` (dev server — RESTART to pick up new `.env.local` keys) · `npm test`
(384, node, no external DB) · `npx tsc --noEmit` · `npm run lint` · `npm run build` ·
`npm run secret-scan` (after build) · `npm run audit:prod` · `npm run email:test`
(dev-only Resend smoke test; needs `RESEND_API_KEY`/`ENQUIRY_EMAIL_FROM`/
`ENQUIRY_EMAIL_TO`) · `npm run db:migrate` (dormant; needs `DATABASE_URL`). CI on push
via GitHub Actions. Validate responsive at 375 / 768 / 1024 / 1440.
