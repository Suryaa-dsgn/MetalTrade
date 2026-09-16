# Project Handoff — Oriental Energy and Minerals

Compact context for a fresh Claude Code session. Read this first, then only the
deeper docs you actually need. Reflects the repo at commit `c0868cb`. Git
preserves history; this file describes CURRENT state only.

## Fresh session bootstrap

1. Read this handoff.
2. Read `CLAUDE.md` (agent rules, guardrails, working protocol).
3. Read `docs/market-provider-readiness.md` for ANY market-data work (verified
   provider contracts, live/gated status, promotion + upgrade steps).
   Read `docs/lead-backend-architecture.md` for ANY Contact/lead-backend work.
   Lead store defaults to in-memory (`LEAD_STORE=memory`, ephemeral); durable
   Postgres is wired but not activated — to run it locally set `LEAD_STORE=postgres`
   + `DATABASE_URL` (+ `DATABASE_SSL=disable` for a local DB) in `.env.local` and run
   `npm run db:migrate`. Tests need no external DB (PGlite runs in-process).
4. Read the Product Blueprint / Design System only if product-IA / visual work.
5. Read `docs/content-claims-register.md` (+ the client DOCX) for public-copy work.
6. `git log --oneline` and `git status` before editing.
7. ONE phase/task per session; PLAN first, wait for approval (per CLAUDE.md).
8. Validate (tsc, lint, test, build, responsive) and STOP for review.

## 0. Where we are RIGHT NOW (most important)

- **Branch:** `fix/markets-explorer-router-update-during-render` (NOT merged to
  `main`; not pushed). Several sessions of work live here on top of `main`.
- **Latest commit:** `c0868cb` "Market Phase D2 (EIA): live Brent Crude benchmark".
- **Big change since the old handoff:** the market layer is no longer mock-only.
  A production-grade **multi-provider market-data architecture** now serves REAL
  live benchmarks alongside labelled sample data, with strong boundaries.
- **Tests:** **87 passing** (Vitest). `tsc`, `eslint`, `next build` all green.
- **Immediately pending decision:** a **Production Security & Reliability audit
  (Stage A) was delivered and is AWAITING USER APPROVAL** to start Stage B
  implementation. See §8. No security code has been written yet.
- **Phase 11 (SEO/analytics/legal) is still NOT started** and must not be
  auto-started.

## 1. Product (unchanged — do not drift)

Trust-first B2B website + market-intelligence portal for **Oriental Energy and
Minerals Limited (OEML)**, a **licensed mineral aggregator** (NOT a miner). The
site does not execute trades; it is form-first. All the Phase 9B content/claims
rules still hold (see §11 of the OLD handoff content, now in git history, and
`docs/content-claims-register.md`). Key guardrails unchanged: no invented
prices/claims, no purple, light mode, no em dashes in public copy, WCAG 2.2 AA.

## 2. Confirmed catalogue (12 commodities)

Gold, Copper (cathode), Lithium, Columbite-Tantalite (Coltan), Tin, Lead-Zinc,
Manganese, Rare Earth Elements, Barite, Bitumen, Iron Ore, Crude Oil. Slugs in
`data/mock/metals.ts`. Bitumen + Crude Oil are commodities, not metals.

## 3. MARKET DATA — current live/sample/unavailable status (critical)

The market layer routes each commodity through a **BenchmarkRegistry →
ProviderRouter → provider adapter**. Per-commodity status:

| Commodity | Source now | Provider / benchmark | Notes |
|---|---|---|---|
| **Gold** | **LIVE** | MetalpriceAPI `XAU`, USD/**troy oz**, EOD | ~4,348. Displayed live. |
| **Crude Oil** | **LIVE** | EIA `RBRTE` (Europe Brent Spot FOB), USD/**bbl** | ~109.51. Labelled "Brent Crude reference benchmark". Public-domain data → displayed live with EIA attribution. |
| **Copper** | sample (labelled) | Metals.Dev `lme_copper`, USD/**MT** — VERIFIED live but display-GATED | Shows sample 8,420 + chart. `publicDisplayApproved:false`. |
| **Lithium** | sample (labelled) | MetalpriceAPI `XLI` (paid + semantic review) | Shows sample 13,750. |
| **Lead-Zinc** | unavailable | two separate verified benchmarks (`lme_lead`,`lme_zinc`) in `LEAD_ZINC_BENCHMARKS` | NEVER blended into one price; catalogue not split. |
| Tin, Manganese, Iron Ore, Coltan, REE, Barite, Bitumen | unavailable ("in preparation") | — | Bitumen must NEVER map to crude. |

- **Providers integrated & verified live (Free tiers):** MetalpriceAPI (Gold),
  Metals.Dev (LME Copper/Lead/Zinc — verified, gated), EIA (Brent — live).
- **Why some are gated:** Metals.Dev commercial public display needs a paid
  subscription; EIA is public-domain so Brent is shown live. Invariant enforced
  by tests: `routing:"live"` REQUIRES `publicDisplayApproved:true`.
- **Keys:** in untracked `.env.local` (git-ignored): `METALPRICE_API_KEY`,
  `METALS_DEV_API_KEY`, `EIA_API_KEY`. `MARKET_PROVIDER` unset → normal registry
  routing; `MARKET_PROVIDER=mock` = full sample/demo build.
- **NO live market history** anywhere: MetalpriceAPI history is paid-gated,
  Metals.Dev timeseries is precious-only, EIA Brent history exists but the
  crude/volume chart UI is deferred. Copper keeps a SAMPLE chart. Never present
  synthetic history under a live quote.

## 4. Market architecture (files)

```
lib/market/
  benchmarks.ts        BenchmarkRegistry: BENCHMARKS (by slug) + LEAD_ZINC_BENCHMARKS;
                       benchmarkId (≠ slug), routing, classification, fallbackPolicy,
                       publicDisplayApproved, provider/providerSymbol, providerUnit,
                       canonicalUnit (MarketUnit = mass | "bbl"), sanityBand, attribution.
  service.ts           registry+router composition, mixed-source, PARTIAL responses
                       first-class, L1 cache (3h) + repository last-known-good, meta.sources.
  normalize.ts         normalizeQuote(raw,cfg,name,retrievedAt,sourceType) → unit convert
                       (mass only) + sanity guard; refuses on unknown/mismatch/out-of-band.
  units.ts             MassUnit + VolumeUnit("bbl") = MarketUnit; convertMassPrice (mass-only,
                       bbl↔mass REFUSED); isMassUnit/isVolumeUnit/isMarketUnit.
  freshness.ts         policies incl. endOfDay, delayed15m, dailyBenchmark(14d), MOCK.
  meta.ts              ReadMeta { provider, source, degraded, sources[] (attributions) }.
  providers/
    types.ts           BenchmarkProvider contract: getLatest(requests:{benchmarkId,providerSymbol}[])
                       → quotes keyed by benchmarkId; RawQuote; ProviderError(code); capabilities.
    router.ts          getProvider(id) → {metalpriceapi, metalsdev, eia, mock}; null = fail-safe.
    metalpriceapi.ts   Gold. Header X-API-KEY auth, Zod-validated, timeout, quota headers.
    metalsdev.ts       LME. api_key query (never logged), Zod, mt→MT, timeout.
    eia.ts             Brent. api_key query (never logged), Zod, string→number, $/BBL→bbl,
                       period→ISO, latest-per-series, empty-data→unavailable.
    mock.ts            sample provider (sourceType "sample") + getSampleExtendedChanges/History.
    health.ts          per-provider health (attempt/success/failure/rateLimited) — tracked,
                       NOT yet used to stop calls (no circuit breaker yet).
  repository/
    types.ts           MarketObservationRepository interface (save/getLatest/getLastKnownGood/getHistory).
    memory.ts          in-memory impl (per-instance; lost on cold start — documented limitation).
    index.ts           getObservationRepository() factory (swap point for durable store later).
```
UI labelling is source-aware: `market-status.tsx` shows "Sample" for sample rows;
`market-freshness.tsx` shows Live/Sample pills; markets + detail pages render
`meta.sources` ("Source: …"). Provider assignments/pricing/commercial terms live
in `docs/market-provider-readiness.md`, NOT in the registry.

## 5. Stack & conventions (unchanged)

Next.js 16 App Router, React 19, TS, Tailwind v4 tokens, Base UI + CVA,
Heroicons (chrome) + Phosphor regular (domain), Recharts, RHF + Zod. `zod` is now
a DIRECT dependency (was phantom). **Vitest** added (`npm test`) with a
`server-only` test stub in `test/vitest-stubs/`. Server Components by default.
`cn` via `createCn` (do not revert — button text colour). No em dashes in copy.

## 6. Providers seams / env (server-only)

`lib/config/env.ts` (Zod-validated, `import "server-only"`): `MARKET_PROVIDER`
(registry|mock), `ENQUIRY_SINK` (log|disabled), `UPLOAD_PROVIDER` (disabled),
`CONTENT_SOURCE` (static), `MARKET_SIMULATE_FAILURE` (dev/QA), plus the three
provider key secrets. Enquiries: `submitEnquiry` server action re-validates with
Zod; `log` sink records redacted metadata only (no PII). Uploads disabled.

## 7. Completed work on this branch (in order)

1. `0d74f25` Fix Router-update-during-render in `markets-explorer.tsx` (URL sync
   moved to a guarded `useEffect`; debounce preserved).
2. `576c940` Declare `zod` as a direct dependency (was transitive/phantom).
3. `e875480`→`c46b9a5` First real provider (MetalpriceAPI/Gold): registry,
   adapter, normalization, mixed-source service, source-aware UI, readiness doc.
4. `c353726` (Sec-arch Phase A) provider router + request-object contract + Zod.
5. `66e2218` (Phase B) MarketObservationRepository seam (in-memory).
6. `e34bafe` (Phase C) provider health + standardized observability events.
7. `6c3d980` (D2) Metals.Dev LME Copper/Lead/Zinc — verified live, display-gated.
8. `c0868cb` (D2) EIA Brent Crude — LIVE + attribution + `bbl` volume unit.

## 8. IMMEDIATE next step (what the user is mid-flow on)

A **"Production Security & Reliability Hardening"** task is in progress. **Stage A
(audit + plan) was DELIVERED in chat and is AWAITING USER APPROVAL.** No security
code written yet. Key audit outcomes to carry forward:

- **Posture is strong:** 0 prod dependency vulns; secrets server-only (not in
  bundle/HTML/logs); no `dangerouslySetInnerHTML`/eval/child_process; no SSRF
  (fetch only in adapters w/ fixed URLs); server-side Zod on the one write path.
- **Findings to fix in Stage B (by phase):**
  - **H1** no security headers/CSP (`next.config.ts` empty). → Sec Phase 2.
  - **H2** enquiry fields have NO `.max()` caps (unbounded input). → Sec Phase 1.
  - **H3** `MARKET_SIMULATE_FAILURE` + `MARKET_PROVIDER=mock` NOT production-gated.
    → Sec Phase 1.
  - **M1** no inbound rate limit on the enquiry action. → Sec Phase 4.
  - **M2** no single-flight coalescing (cold-cache thundering herd). → Sec Phase 3.
  - **M3** no circuit breaker (health tracked but unused). → Sec Phase 3.
  - **M4** in-memory state breaks horizontal scaling (durable store later).
  - **M5** log sink uses `console.info` not the redacting logger. → Sec Phase 1.
  - **M6** no CI security gate. → Sec Phase 5.
  - dev-only vitest vulns (do NOT `audit fix --force`).
- **Proposed Stage B phases:** 1 critical hygiene → 2 headers/CSP (report-only
  first) → 3 provider resilience (single-flight + breaker + bounded retry) → 4
  rate limiting + Turnstile seam (disabled) → 5 secret-scan test + CI gate → 6
  docs (`docs/security-production-readiness.md`) + correlation IDs.
- **Deployment platform is undecided** (no vercel.json/Dockerfile/CI). Edge
  DDoS/WAF/bot/rate-limit are HOST DASHBOARD actions (recommend Vercel or
  Cloudflare-fronted), NOT Next.js code.
- **Open approval questions:** platform choice; CSP report-only rollout; app-level
  rate limiter now vs edge-only; per-instance circuit breaker OK; durable KV
  (Upstash/Vercel KV) approval when multi-instance; CI provider; bounded-retry
  policy. Do NOT add Redis/Postgres/KV without explicit approval.

If the user says "proceed", start Sec Phase 1 (code-only, low risk), one
increment per commit, validating tsc/lint/test/build + security checks each time.

## 9. Runbook phases still pending (after security work)

- **Phase 11 — SEO, analytics, legal** (metadata/OpenGraph, sitemap, robots,
  canonical, structured data, consent-aware PII-free analytics, and the legal
  pages: privacy/terms/cookies/accessibility/market-disclaimer). Footer already
  links `/privacy` `/terms` `/cookies` `/accessibility` but those routes DO NOT
  exist yet. NOT started; gated on explicit go-ahead.
- **Phase 12 — final QA.**
- Client-dependent: cleared imagery for the 9 non-imaged commodities; resolve
  pending claim clarifications (see `docs/content-claims-register.md`).

## 10. Things the next agent must NOT do

- Do not merge/push this branch or start Phase 11 without being asked.
- Do not start Security Stage B until the user approves the Stage A plan.
- Do not add a database/Redis/KV/microservices, build custom DDoS in Next, or
  guess the deploy platform — all require approval/decisions.
- Do not display Metals.Dev Copper/Lead/Zinc live (commercial gate) or blend
  Lead-Zinc into one price; do not map Bitumen to crude; do not present synthetic
  history under a live quote; do not invent prices/claims.
- Do not log secrets, full provider URLs, or enquiry PII; keep keys out of the
  client bundle. Do not revert the `cn` font-size config.
- Do not redesign the Markets UI or change product behaviour except where
  security requires it.
</content>
