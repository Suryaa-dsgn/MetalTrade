# Build runbook

Phase-by-phase execution for Claude Code. `CLAUDE.md` carries the standing rules, so kickoff prompts stay short. Run one phase per session, in order, and wait for your own "Proceed to Phase X" before moving on.

Setup before Phase 0:
1. Put both spec docs in `/docs`.
2. Put `CLAUDE.md` at the repo root.
3. Confirm the icon rule in `CLAUDE.md` (Heroicons for chrome, Phosphor `regular` for domain), or switch it to Phosphor-only.
4. Optional: add the two slash commands at the end of this file to `.claude/commands/`.

Each phase below: the goal, what to produce, the icon and design notes that matter for that phase, the exit gate, and a paste-ready kickoff prompt.

---

## Phase 0 — Repository audit and implementation plan

Goal: understand the existing codebase and reconcile it with the two specs. No UI yet.

Produce an audit reporting: framework, package manager, source structure, routes, dependencies, styling solution, existing components, public assets, and whether each of these is present and how configured: Tailwind, shadcn, Geist, the icon libraries, Recharts/shadcn Chart, React Hook Form, Zod. Then a written implementation plan and a list of conflicts between the repo and the specs (the icon deviation is a known one, already resolved in `CLAUDE.md`).

Exit gate: audit and plan delivered, zero files modified.

Kickoff:
> Begin Phase 0. Read `/docs/*` and `CLAUDE.md` completely, then audit this repository per the Blueprint Phase 0 checklist and report findings plus an implementation plan. Do not modify any files. Use the end-of-phase report format, then stop.

---

## Phase 1 — Foundation and design tokens

Goal: establish the visual and engineering foundation. No full pages.

Produce: Geist configured, the exact semantic colour tokens, type scale, spacing, radius, border, shadow, and motion tokens from the Design System mapped into Tailwind and CSS variables. Positive, negative, warning, and info states wired. shadcn initialised. Both icon barrels created (chrome and domain) with the split from `CLAUDE.md`. Folder architecture created. `Container` and `Section` primitives, justified typography primitives, Button variants matching the Design System button hierarchy, visible focus styles. An optional internal token test page if it helps you verify.

Icon note: build the icon barrels here so every later phase imports from them, not from the libraries directly.

Exit gate: tokens verifiable, Button and focus styles correct, desktop and mobile checked. No Home page.

Kickoff:
> Begin Phase 1 per the Blueprint. Configure Geist, all Design System tokens, shadcn, the icon barrels, the folder architecture, and the Container/Section/Button primitives with focus styles. Follow `CLAUDE.md`. Plan first and wait for my approval before coding.

---

## Phase 2 — Global shell

Goal: the reusable website chrome.

Produce: header, desktop navigation, mobile navigation, primary CTA (`Discuss a Requirement`), footer with legal placeholders, breadcrumb primitive, global page container, active-state strategy, and navigation focus states. Responsive navigation behaviour across the four widths.

Icon note: chrome only, so Heroicons exclusively here (menu, close, chevrons, search). The active tab uses Industrial Cobalt text with a 2px underline or a quiet filled state, never a purple pill.

Exit gate: verified at 375, 768, 1024, 1440.

Kickoff:
> Begin Phase 2 per the Blueprint: global shell (header, desktop and mobile nav, primary CTA, footer, breadcrumb, container, active states, focus states). Heroicons only for chrome. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 3 — Home page

Goal: build Home in the Blueprint and Design System section order.

Produce, in order: hero with supplier and buyer CTAs, compact market ticker, metals showcase (editorial metal cards), source to trade desk to logistics to buyer story, supplier proposition, buyer proposition, trust framework, logistics preview, proof section, final CTA. Use controlled mock market fixtures through the adapter. Do not present mock prices as live. Use `/public` imagery where supplied and mark missing assets with named TODOs.

Icon note: chrome elements use Heroicons. The metal cards, the source-to-buyer story, and trust points may use Phosphor `regular` domain icons, sparingly.

Exit gate: full responsive states, no fabricated content or live-looking mock data.

Kickoff:
> Begin Phase 3 per the Blueprint: Home page in the specified section order, using mock market fixtures through the adapter and `/public` imagery. Flag missing assets. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 4 — Markets overview

Goal: the market-intelligence overview page.

Produce: page header with freshness and status indicator, metal search, filters, unit selector, currency selector, market table with sorting and positive/negative/neutral states, mobile behaviour, and the loading, empty, stale, error, and unavailable-value states. A benchmark disclaimer. Typed mock market data through the adapter. No real API.

Icon note: Heroicons for sort, search, and direction. Positive and negative movement always pair colour with an arrow and text, never colour alone.

Exit gate: every listed state renders correctly, table stays meaningful on mobile.

Kickoff:
> Begin Phase 4 per the Blueprint: Markets overview with search, filters, unit and currency selectors, sortable table, and all async states, on typed mock data through the adapter. Include the benchmark disclaimer. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 5 — Metal detail template (Copper first)

Goal: one metal only, Copper, as the template. Do not build every metal.

Produce: breadcrumb, metal identity, current benchmark block (absolute change, percentage change, unit, currency, provider placeholder, timestamp, status), historical price chart with 1D/7D/1M/3M/1Y/5Y controls and tooltip and an accessible chart alternative, market statistics, material image, forms and grades, specifications, physical pricing factors, supplier CTA, buyer CTA, and complete responsive states.

Icon note: Heroicons for chart controls and direction. Phosphor `regular` for forms, grades, and specification markers. Chart follows the Design System exactly: restrained series, low-contrast gridlines, tabular values, no purple, no glow, no gradient unless approved. Only expose period controls the mock data actually supports.

Exit gate: Copper reviewed and approved before generalising to Gold, Lithium, and others.

Kickoff:
> Begin Phase 5 per the Blueprint: the Copper metal detail page only, as a reusable template, including the historical chart with period controls, tooltip, and accessible data-table alternative. Do not build other metals yet. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 6 — Trade and logistics

Goal: the trade and logistics story.

Produce: editorial hero, trade lifecycle, and modules for inspection, documentation, collection, inland transport, port and freight, customs, and delivery. Supported-mode presentation, Incoterm explanation, capability boundaries, logistics CTA, and a responsive timeline. Do not claim capabilities without source content.

Icon note: this is the densest domain-icon page. Phosphor `regular` for the lifecycle stages and logistics modes. Heroicons only for navigation within the page.

Exit gate: timeline responsive, no unsupported capability claims.

Kickoff:
> Begin Phase 6 per the Blueprint: Trade and Logistics page with the lifecycle timeline, inspection and documentation modules, supported modes, Incoterm explanation, capability boundaries, and CTA. Phosphor domain icons. Do not claim unsupported capabilities. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 7 — Company and trust

Goal: the company and responsible-sourcing story.

Produce: company proposition, role in the value chain, operating model, metal categories, a regions placeholder if unknown, trust framework, responsible-sourcing presentation, due-diligence presentation, a verified proof-point architecture, and a CTA. Do not claim certification or compliance that has not been supplied.

Icon note: Phosphor `regular` for trust and process steps and metal categories. Trust comes from evidence fields (grade, purity, origin, assay, inspection, documentation, Incoterm, delivery), not adjectives.

Exit gate: proof points are structured placeholders where content is unknown, not fake facts.

Kickoff:
> Begin Phase 7 per the Blueprint: Company and Responsible Sourcing page with proposition, operating model, metal categories, trust framework, due diligence, and a proof-point architecture. Use placeholders for unsupplied proof points. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 8 — Enquiry experience

Goal: the enquiry hub, then four independent forms.

Produce: the enquiry hub first, then Supplier, Buyer, Logistics, and General forms independently, using React Hook Form and Zod. Intent selection, form schemas, validation, error summary, input preservation, progress indicator where useful, accessible fields, an attachment UI shell, consent UI, and loading, error, and success states with a reference-number UI and an expected-next-step UI. Use a mocked submission or server action. Do not wire production CRM or email.

Icon note: Heroicons for form affordances and the attachment control. Do not request highly sensitive information unless the Blueprint allows it.

Exit gate: inputs preserved through validation errors, every form keyboard-accessible, success state shows a clear next step.

Kickoff:
> Begin Phase 8 per the Blueprint: enquiry hub plus Supplier, Buyer, Logistics, and General forms with React Hook Form and Zod, full validation and error summary, input preservation, consent and attachment UI shells, and mocked submission with a reference-number and next-step success state. No production CRM or email. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 9 — Real content and asset pass

Goal: replace placeholders once I provide assets and content.

Produce: replaced temporary images with verified focal positions and optimised delivery, correct alt text, recorded credit and licensing metadata, replaced placeholder copy, removed unapproved claims, verified metal forms and specifications, verified logistics capabilities, verified company proof points, and a visual-consistency pass across pages.

Exit gate: no placeholder content or unapproved claims remain.

Kickoff:
> Begin Phase 9 per the Blueprint. I will provide assets and content. Replace placeholders, set alt text and license metadata, remove unapproved claims, and verify consistency across pages. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 10 — Data and backend integration

Goal: only after I approve provider decisions.

Potential: market API integration, server-side adapter, caching, freshness handling, stale fallback, provider-failure state, enquiry server actions or API, secure upload service, email or CRM integration, CMS integration. Never expose secrets client-side. Do not begin until I approve the provider.

Exit gate: secrets server-side only, all failure and stale states handled.

Kickoff:
> Begin Phase 10 per the Blueprint, only using the providers I have approved. Wire the market adapter, caching and freshness, enquiry server actions, and any approved integrations, with no client-side secrets. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 11 — SEO, analytics, and legal

Produce: metadata, OpenGraph, sitemap, robots rules, canonical URLs, legitimate structured data, analytics event names from the Blueprint, consent-aware tracking with no PII, and the privacy, terms, cookies, accessibility, and market-disclaimer pages.

Exit gate: no PII in analytics, disclaimer present, structured data legitimate.

Kickoff:
> Begin Phase 11 per the Blueprint: metadata, OpenGraph, sitemap, robots, canonicals, legitimate structured data, consent-aware analytics with no PII, and the legal and disclaimer pages. Follow `CLAUDE.md`. Plan first, wait for approval.

---

## Phase 12 — Final QA and polish

Goal: systematic QA against the Blueprint QA checklist.

Cover: visual (tokens respected, no purple, no unwanted gradients, no AI-slop, consistent typography, cards, controls, imagery), responsive at all four widths, accessibility (keyboard-only, focus order and visibility, contrast, heading structure, reduced motion, chart alternatives, form errors, dialog focus), data (unavailable, loading, stale, delayed, error states, no fake zeros), engineering (typecheck, lint, production build, console warnings, broken links, unnecessary dependencies, duplicate components, large client bundles, image optimisation), and content (no fake metrics, customers, compliance claims, prices, lorem ipsum, or licensing violations). Deliver a final QA report.

Kickoff:
> Begin Phase 12 per the Blueprint: full QA across visual, responsive, accessibility, data, engineering, and content checklists. Produce a final QA report. Follow `CLAUDE.md`.

---

## Optional slash commands

Save these under `.claude/commands/` to reuse across phases.

`.claude/commands/phase-wrap.md`
```
Run the relevant validation for the current phase: typecheck, lint, and a production build if applicable. Fix only errors this phase introduced. Then inspect responsive behaviour at 375, 768, 1024, and 1440. Produce the end-of-phase report in the CLAUDE.md format, mark the phase checklist, and STOP. Do not begin the next phase.
```

`.claude/commands/responsive-check.md`
```
Walk the current page at 375, 768, 1024, and 1440. For each width report layout integrity, whether primary actions are visible without hover, whether tables scroll rather than lose meaning, and any overflow or truncation. Do not change code yet, just report what needs fixing.
```
