# CLAUDE.md

Standing context for Claude Code on the physical metals trading and market-intelligence portal.
Read this at the start of every session. It does not replace the specs, it points to them.

## Source of truth

Two documents in `/docs` are the primary source of truth. Read BOTH completely before touching the repo in any phase.

- `/docs/physical-metals-trading-platform-ux-product-blueprint.md` defines WHAT we build and WHY (product behaviour, scope, phase plan).
- `/docs/metal-trading-portal-design-system.md` defines HOW it looks, behaves, and is implemented visually (tokens, type, components, states, guardrails).

Conflict rule: product and business behaviour comes from the Blueprint. Visual and component decisions come from the Design System. If ambiguity remains, STOP and ask. Do not invent a resolution.

## Product model (do not drift)

B2B physical metals intermediary. Suppliers and sources feed a client trade desk, which connects to qualified buyers. The site does NOT execute trades.

The MVP must NOT introduce: public bidding, instant checkout, wallets, crypto mechanics, automatic trade matching, payments, settlement, trading signals, investment recommendations, fake trading functionality, or authenticated trading dashboards, unless I explicitly request it later.

The site exists to establish credibility, show physical metal expertise, provide market benchmarks, demonstrate access to qualified supply and demand, communicate verification and logistics capability, and collect structured supplier, buyer, and logistics enquiries.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, shadcn Chart on Recharts, React Hook Form, Zod.

Detect the package manager from the lockfile (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock`/`bun.lockb`) and use only that one. Never mix managers. Inspect the existing repo before installing anything and do not replace a correctly configured project.

Install shadcn primitives only when the current phase needs them, not all at once. Extend styling through semantic CSS variables, Tailwind utilities, and `class-variance-authority`. Do not fork accessible behaviour.

## Integration configuration (Phase 10 seams)

External integrations sit behind provider seams with mock / no-op / disabled defaults; the app runs with no env set. Selectors are validated (Zod) in a server-only module `lib/config/env.ts` (`import "server-only"`); an unknown value warns and falls back to the default. Never read provider config or secrets from a client module; secrets live server-side only and are never committed (`.env.example` holds names/placeholders only — see the README table).

- `MARKET_PROVIDER` (default `mock`): `MarketProvider` (`lib/market/provider.ts`) owns quotes/history only; `ContentSource` (`lib/content/source.ts`) owns catalogue/editorial; the market service (`lib/market/service.ts`) composes them and adds caching, per-feed freshness (`lib/market/freshness.ts`), and failover. Only successful payloads are cached; on failure serve last-known-good marked stale, else uncached unavailable. Reads return `ReadMeta` (no raw errors to the client). Sample data stays labelled indicative / not live.
- `ENQUIRY_SINK` (default `log`): delivery seam for `submitEnquiry`; the log sink records redacted metadata only (no PII). `disabled` returns a submission error. No email/CRM.
- `UPLOAD_PROVIDER` (default `disabled`): no storage, no presign endpoint; the attachment UI stays a shell.
- `CONTENT_SOURCE` (default `static`); `MARKET_SIMULATE_FAILURE=1` exercises the degraded market UI.

Gating: no live market feed, email/CRM, storage, or CMS SaaS is connected until I approve the specific provider and set its secrets myself.

## Icons (this overrides the Blueprint's Lucide instruction and its no-mixing rule)

Two libraries, split strictly by role. One weight each. No mixing inside a role.

- `@heroicons/react` for UI chrome only: navigation, search, close, chevrons, arrows, menu, form affordances, table sort controls, price direction indicators. Use one tier per size: outline 24 for default, mini 20 for controls, micro 16 for inline. Do not mix outline and solid in the same control group.
- `@phosphor-icons/react` for domain and editorial icons only: logistics stages, metal categories, trust and process steps, capability markers. Weight `regular` ONLY. Never duotone, fill, or bold as decoration.
- Never use Lucide. Never use emoji as interface icons. Never introduce a third icon set.
- If Heroicons lacks a needed UI glyph, use Phosphor `regular` for that one control and leave a code comment noting it.
- Wrap both behind thin barrels (for example `components/ui/icon.tsx` for chrome, a per-domain map for editorial) so a library swap stays a one-file change.
- Keep visual stroke weight consistent between the two. Icons support meaning, they do not decorate every label. Roughly 16 to 20px for controls.

## Non-negotiable guardrails

From Design System sections 21 and 22, and the Blueprint AI-slop rules.

Visual:
- Light mode is the default and stays the default.
- No purple, violet, lavender, indigo, or purple-adjacent gradients. Industrial Cobalt is allowed because it is visibly blue, not violet.
- Use the exact CSS variables from the Design System. Do not scatter arbitrary `bg-[#xxxxxx]` or `text-[#xxxxxx]` through components. Centralise tokens.
- Signal Orange is a sparse accent with a semantic reason, never a second dominant brand colour.
- No glassmorphism, neon glow, mesh backgrounds, decorative gradients, glowing or 3D charts, floating decorative shapes, gradient text, or an icon inside every heading.
- Do not turn every section into a rounded card grid. Do not put a shadow on every card. The product should feel engineered, not inflated.

Content:
- Never invent prices, quantities, certifications, partners, buyer or supplier identities, trading volumes, office locations, countries served, years in business, customer metrics, or compliance claims.
- If real content is unavailable, use an explicit development placeholder or an empty state with a clearly named TODO. Placeholders must not look like verified production facts.
- Never present mock market values as live data. A chart with placeholder data must not look real.

Data and assets:
- Keep market data and CMS content separate from presentation. Components receive typed props, they do not embed invented values. Use the `MarketQuote` shape from the Design System.
- Do not connect a production market provider, and do not scrape any market site, without my approval. Never expose provider credentials client-side.
- Use imagery only from `/public/images` following the Design System naming convention. Never fetch, hotlink, or fabricate stock imagery. If an image is missing, build the layout expecting it, use a deliberate neutral placeholder, add a named TODO, and tell me which asset is needed.

Every async unit defines loading, empty, stale, error, and success behaviour where applicable.
Every chart defines unit, currency, selected range, updated timestamp, tooltip, and an accessible text or data-table alternative.
Every image has meaningful alt text, plus license metadata when externally sourced.
Every form preserves input through validation and exposes a clear next step after submission.

## Architecture

```
components/
  ui/          shadcn primitives and icon barrels
  brand/       logo, wordmark, section labels
  editorial/   hero, image sections, process story
  market/      ticker, chart, market table, metric cards
  trade/       trust steps, logistics timeline
  forms/       enquiry forms
  layout/      header, footer, container, responsive rails
lib/
  formatters/  price, percent, date, quantity (tabular)
  market/      typed models, mock adapter
  validation/  Zod schemas
  assets/      image asset records
  accessibility/
data/
  mock/        clearly identified fixtures
  config/
```

Server components by default. Add `"use client"` only where interaction requires it (chart interaction, client-state tabs, forms, drawers, local UI). Do not client-render the whole site because one child is interactive. No 700-line page components. Extract when repeated, independently testable, logically meaningful, or visually reusable. Do not over-componentise simple markup.

## Working protocol (phase-gated, this is critical)

1. One phase per session. Do only the current phase. Do not scaffold or touch future phases.
2. Start in plan mode. Present your plan for the phase and wait for my approval before writing code.
3. At the end of every phase, produce the report below, then STOP. Never auto-advance. I will say "Proceed to Phase X".
4. Validate before reporting: typecheck, lint, production build as relevant, and responsive behaviour at 375, 768, 1024, 1440. Fix errors your phase introduced.
5. Commit at each phase boundary so review is clean.

When a requirement is ambiguous: prefer established tokens and existing component patterns, prefer a simple evidence-led layout over a decorative concept, prefer a real empty state over invented content, prefer a stable responsive stack over preserving a desktop composition, flag missing data or claims in a TODO, and ask rather than guess. Do not expand scope into dashboards, checkout, trading execution, or accounts unless I ask.

## Definition of done for a phase

A phase is not done because the page renders. It must match the Design System, satisfy the Blueprint, work responsively, work with keyboard, contain the appropriate states, introduce no TypeScript errors, cause no accessibility regression, avoid unsupported content, avoid needless dependencies, reuse established components, and pass the relevant checks. Target WCAG 2.2 AA. Respect `prefers-reduced-motion`.

## End-of-phase report format

```
## Phase X completed

### Implemented
### Files changed
### Dependencies added
### Validation performed
### Browser checks
### Missing assets/content
### Decisions/TODOs
### Phase checklist
- [x] ...
- [ ] ...
### How I can verify it
1. ...
```

Then STOP and wait for approval.
