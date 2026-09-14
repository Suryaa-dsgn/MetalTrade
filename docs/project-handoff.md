# Project Handoff — Oriental Energy and Minerals

Compact context for a fresh Claude Code session. Read this first, then only the
deeper docs you actually need. This reflects the repository at commit `1bd6575`
(Phase 9B). Git preserves history; this file describes CURRENT state only.

## Fresh session bootstrap

1. Read this handoff.
2. Read `CLAUDE.md` (agent rules, guardrails, working protocol).
3. Read the Product Blueprint only if product behaviour/IA is relevant.
4. Read the Design System only if visual/component work is relevant.
5. Read `docs/content-claims-register.md` (+ the client DOCX) for any public-copy work.
6. Run `git log --oneline` and `git status` before editing.
7. Work on ONE phase/task only; plan first, wait for approval (per CLAUDE.md).
8. Validate (tsc, lint, build, responsive) and STOP for review.

## 1. Current project status

- **Product:** trust-first B2B website + market-intelligence portal for **Oriental
  Energy and Minerals Limited**, a licensed mineral aggregator.
- **Mode:** CLIENT REFERENCE / VISION BUILD. Everything runs on mock/demo data; no
  live providers connected.
- **State:** Phases 1–10 + an ad-hoc content phase (9B) are implemented and
  committed. All major pages, forms, market demo, provider seams, and image system
  exist.
- **Latest commit:** `1bd6575` "Phase 9B: client content integration and claims
  alignment".
- **Next runbook phase:** **Phase 11 — SEO, analytics, and legal** (not started).
  See §16. Do not auto-start it; wait for the user to say "Proceed to Phase 11".

## 2. Read these files first (source of truth)

- `CLAUDE.md` → agent rules, repo conventions, guardrails, phase-gated protocol.
- `README.md` → tech stack + architecture overview + integration/env table.
- `docs/physical-metals-trading-platform-ux-product-blueprint.md` → product
  behaviour / IA / journeys / scope.
- `docs/metal-trading-portal-design-system.md` → tokens, type, components, states.
- `docs/build-runbook.md` → phase plan (Phases 1–12) and per-phase exit gates.
- `docs/content-claims-register.md` → approved vs pending public claims (Phase 9B).
- `Website Content Inputs - Answers in Blue.docx` (repo root, untracked) → the
  client's raw business answers. Facts already extracted into config + the claims
  register; do not re-derive unless verifying.
- This handoff → session summary and continuation pointer only.

Config that is the practical source of truth for content/business facts:
`data/config/site.ts`, `company.ts`, `logistics.ts`, `enquiry.ts`;
`data/mock/metals.ts` (catalogue) + `data/mock/market.ts` (sample quotes).

## 3. Product model

- Oriental Energy and Minerals Limited = **licensed mineral aggregator**.
- NOT a licensed miner / mining company / mining operator. A pending mining licence
  is **internal only** (claims register); never publish it as a current credential.
- **Suppliers are not introduced directly to buyers.** The company sits between
  reviewed supply and vetted corporate/institutional demand.
- Verification is described as a **process**, never a blanket "verified supply".
- Form-first engagement. The site does not execute trades.

## 4. Confirmed commodity catalogue (12)

Gold, Copper (cathode), Lithium, Columbite-Tantalite (Coltan), Tin, Lead-Zinc,
Manganese, Rare Earth Elements (REE), Barite, Bitumen, Iron Ore, Crude Oil.

- **Bitumen and Crude Oil are commodities, not metals.** Do not call all 12
  "metals". Use "commodities / minerals and commodities / material". "Markets" stays
  the nav name (metal-market UI wording is fine there).
- Slugs live in `data/mock/metals.ts`. Removed in 9B: Aluminium, Nickel, standalone
  Zinc (Zinc folded into Lead-Zinc), and the old Rhodium/FeSiMn "pressure rows".

## 5. Market-demo policy (important, do not regress)

- Copper, Gold, Lithium → keep clearly-labelled **sample** market data
  (`data/mock/market.ts`, keyed by symbol Cu/Au/Li).
- The other 9 commodities → **no invented price/history/symbol**; they resolve to
  "Unavailable" in tables and a "Detailed profile in preparation" detail page.
- `Metal.symbol` and `Metal.forms` are OPTIONAL (`lib/market/types.ts`); commodities
  without an approved market identity have no symbol/forms (no fabricated codes).
- All market values stay labelled **indicative / sample / not live**. Copper keeps a
  working Recharts chart. Do NOT remove visible mock data because APIs aren't
  connected — this is a vision build.

## 6. Home / catalogue visual policy

- Home "What we trade" renders **all 12** commodities with the existing `MetalCard`.
- Real images where supplied (Copper, Gold, Lithium); neutral `AssetPlaceholder`
  otherwise (`lib/assets/metals.ts` has `available:false` records for the 9 new
  ones; drop a cleared image in + flip `available` later, no component change).
- Implemented grid: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (2 tablet, 3
  laptop, 4 wide desktop, 1 mobile). Do not invent or fetch images.

## 7. Confirmed client workflows

**Supplier:** material type + quantity + location + documents → initial review →
company engineer inspects facility and goods → if approved AND a vetted buyer is in
place → **independent third-party inspection and testing**. Client mentioned **SGS**
internally; public use of the SGS name is NOT approved — use "independent
third-party inspection and testing".

**Buyer:** sends specification, target volume, order frequency, target price,
delivery destination → requirements confirmed → suitable supply proposed → price
quote. The buyer form has a **Target price** field.

**Logistics:** company coordinates **inspection, freight, and customs at the origin**
airport/port. Buyer handles **customs at the destination**. **Financing is not
provided.** Do not claim warehousing, insurance, tracking, specific ports/lanes, or
"all transport modes" as standard services (moved to out-of-scope in 9B).

## 8. Trust / verification / licensing

Confirmed and published: supplier verification; origin documents; engineer +
independent third-party inspection; licence/permit/registration numbers available to
vetted counterparties **on request**. Do NOT: publish licence documents; show
certification badges; claim association membership (none currently); call OEML a
miner/mining company; publish the pending mining licence. No KYB/beneficial-ownership
/sanctions claims (client did not confirm; removed in 9B).

## 9. Regions and counterparties

Suppliers: currently Africa, open to qualified supply from other regions. Buyers:
industrial buyers and financial institutions in Asia and the Middle East. Avoid vague
"global network" claims.

## 10. Proof points (current implementation)

Published: **"4 years of trade experience"** (exact wording; never "4 years in
business" / "operating for 4 years") and **"12 confirmed commodities"**. The
**16-country** claim is held **pending** (unpublished) until clarified whether it
refers to OEML, historical team activity, or both. Home `ProofSection` +
`components/company/proof-points.tsx` reflect this.

## 11. Contact / enquiries

Form-first; no invented email/phone/hours/SLA (`data/config/site.ts` contact is
null). Enquiry routes: `/contact` (hub) → `/enquire/supply`,
`/enquire/buying-requirement`, `/enquire/logistics`, `/enquire/general`. Submission is
mocked (DEMO reference codes); keep that behaviour.

## 12. Architecture snapshot

Routes (`app/`): `/`, `/markets`, `/markets/[slug]`, `/trade-logistics`, `/company`,
`/contact`, `/enquire/{supply,buying-requirement,logistics,general}`, `/style-guide`
(dev-only, blocked in production).

**Frontend:** Next.js 16 App Router + React 19 + TypeScript; Tailwind v4 semantic
tokens (`app/globals.css`); Base UI primitives (shadcn layer) + `class-variance-
authority`; Heroicons chrome barrel (`components/ui/icon.tsx`) + Phosphor `regular`
domain barrel (`components/ui/domain-icon.tsx`); Geist fonts; Recharts; React Hook
Form + Zod. Server Components by default; `"use client"` only where needed.
`cn` (`lib/utils.ts`) is configured via `createCn` to register the custom `--text-*`
font-size scale so text-size utilities don't strip text-colour classes (this is why
primary buttons render correct white text — do not revert).

**Market:** page → `lib/market/service.ts` (read layer: caching, per-feed freshness,
failover, `ReadMeta`) → `MarketProvider` (`lib/market/provider.ts`, quotes/history
only) → mock provider today (`lib/market/providers/mock.ts`); catalogue/editorial via
`ContentSource` (`lib/content/source.ts`). Selected by `MARKET_PROVIDER` (default
mock). Sample data stays labelled not-live.

**Enquiries:** form → RHF/Zod → `submitEnquiry` server action re-validates → pluggable
`EnquirySink` (`lib/enquiries/sink.ts`); default `log` sink records redacted metadata
only (no PII); `ENQUIRY_SINK` (default log). No email/CRM.

**Uploads:** `lib/uploads/service.ts` is a **disabled** seam (no storage, no presign
endpoint); attachment UI is a non-uploading shell. `UPLOAD_PROVIDER` (default
disabled).

**Content:** `ContentSource` static/in-repo today (`CONTENT_SOURCE`, default static);
CMS not live. Config in `lib/config/env.ts` is server-only (Zod-validated selectors;
unknown value warns + falls back). `MARKET_SIMULATE_FAILURE=1` exercises degraded UI.
`.env.example` documents selectors; no secrets committed.

## 13. Design rules that must not regress

Light mode default; **no purple/violet/lavender** (Industrial Cobalt primary is
blue). Restrained institutional/industrial language; Geist typography; tabular
numerals for market data; no glassmorphism/neon/gradient-text/AI-slop; not every
section a rounded card. **No em dashes in public copy** (use commas/colons/periods).
Subtle image hover zoom scales the **image only**, never the whole card (CSS-only,
`components/editorial/asset-image.tsx` + `.asset-zoom*` in globals.css). Price chart
uses a subtle cobalt area gradient under a crisp line. Preserve accessibility (WCAG
2.2 AA) and `prefers-reduced-motion`.

## 14. Asset rules

Imagery only from `/public/images` via the `AssetImage` system; placeholders remain
for missing assets; never fetch/hotlink/fabricate stock; record `license/usage`
provenance (`lib/assets/*`); images must not imply client ownership/operations unless
verified. Currently missing: cleared images for the 9 newer commodities (Tin,
Lead-Zinc, Manganese, Iron Ore, Coltan, REE, Barite, Bitumen, Crude Oil) and cleared
replacements for the excluded home buyer/supplier/lithium originals (archived under
`design/asset-originals/`, git-ignored).

## 15. Completed work (from git history + repo state)

- [x] Foundation, tokens, global shell, header/footer
- [x] Home (hero rotator, propositions, network flow, proof, CTA)
- [x] Markets overview + Copper detail/chart template + minimal "in preparation" template
- [x] Trade & Logistics; Company / trust
- [x] Enquiry hub + supplier/buyer/logistics/general forms (RHF/Zod, mocked)
- [x] Image/asset pass + shared image hover zoom
- [x] Phase 10 provider-ready seams (market/enquiry/upload/content), mock defaults
- [x] Em-dash cleanup; primary-button colour fix; chart area gradient; CTA ship image
- [x] Phase 9B client content + claims alignment (12 commodities, workflows, boundaries)
- [ ] Phase 11 — SEO, analytics, legal (NOT started; footer legal links currently 404)
- [ ] Phase 12 — final QA
- [ ] Client-dependent: real imagery for 9 commodities; resolve pending clarifications

## 16. Current active task / next session starting point

**Phase 9B is already implemented — do NOT redo it.**

NEXT RUNBOOK PHASE: **Phase 11 — SEO, analytics, and legal** (see
`docs/build-runbook.md`). It is gated on the user saying "Proceed to Phase 11".
Scope (per runbook): metadata/OpenGraph, sitemap, robots, canonical URLs, legitimate
structured data, consent-aware analytics with **no PII**, and the legal pages
(**privacy, terms, cookies, accessibility, market disclaimer**). Note: the footer
already links `/privacy`, `/terms`, `/cookies`, `/accessibility`, but those routes do
**not exist yet** — Phase 11 must create them. Then Phase 12 = final QA.

Also outstanding but client-dependent (not autonomous work): supply cleared images
for the 9 commodities + the excluded home slots; resolve the §17 clarifications.

If the user instead asks for a different task, derive scope from actual repo state,
not from this list.

## 17. Pending client clarifications

1. Can SGS be named publicly?
2. Does "active across 16 countries" refer to the current company, historical team
   activity, or both?
3. Should the bank-guarantee transaction structure be explained publicly?
4. Should public phone/email be added later?
5. Has the mining licence now been granted, or is it still pending?
6. Are any logistics capabilities approved beyond inspection, freight, and
   origin-side customs?

## 18. Things the next agent must NOT do

- Do not redesign existing pages or change the design system.
- Do not replace mock market data with empty states; do not invent prices, forms,
  grades, specifications, or ticker symbols.
- Do not call OEML a licensed miner/mining company; do not advertise the pending
  mining licence publicly.
- Do not say suppliers are introduced directly to buyers; do not add financing; do
  not invent logistics capabilities (warehousing/insurance/tracking/lanes/ports).
- Do not invent phone/email/hours/SLA.
- Do not use em dashes in public copy; do not reintroduce purple.
- Do not connect live providers/secrets without explicit approval.
- Do not revert the `cn` font-size config (breaks button text colour).
- Do not start unrelated phases automatically; one phase per session, plan first,
  stop for review.
