# Metal Trading Portal

A trust-first B2B website for a physical metals trading and market-intelligence
business. It connects verified metal supply with qualified demand, presents market
benchmarks and context, explains trade and logistics capability, and captures
structured supplier, buyer, and logistics enquiries. The site does not execute
trades; it qualifies and routes demand to a human trade desk.

The current build runs entirely on mock/demo data. Market quotes, historical
charts, and enquiry delivery sit behind provider interfaces and stay on
mock/no-op defaults until live providers are approved and connected.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 with semantic CSS-variable tokens (light mode is the default)
- Base UI (`@base-ui/react`) primitives styled in the shadcn layer; `class-variance-authority` for variants
- Recharts for price and history charts
- React Hook Form + `@hookform/resolvers` + Zod for forms and validation
- Heroicons (UI chrome) and Phosphor Icons (domain/editorial), each behind a thin barrel
- `server-only` to keep provider config and secrets off the client

## Project structure

```
app/
  markets/          markets overview and [slug] metal detail
  enquire/          supply | buying-requirement | logistics | general
  company/  trade-logistics/  contact/
  style-guide/      dev-only token and component reference (blocked in prod)
components/
  ui/               primitives + icon barrels (icon.tsx, domain-icon.tsx)
  layout/  brand/  editorial/   editorial includes AssetImage
  market/           ticker, table, chart, statistics, freshness/status
  trade/  company/  forms/
data/
  config/           editorial and site content (typed, no invented facts)
  mock/             clearly labelled sample market fixtures
lib/
  market/           provider interface, mock provider, read service, freshness, meta
  content/          ContentSource seam (catalogue/editorial)
  enquiries/        submitEnquiry server action + delivery sink seam
  uploads/          upload service seam (disabled)
  validation/       Zod schemas
  config/           server-only, validated env selectors
  assets/  formatters/  accessibility/  utils.ts
public/images/      editorial and material imagery (WebP)
docs/               product blueprint + design system (source of truth)
```

## Architecture

### UI

Server Components by default; `"use client"` is used only where interaction
requires it (forms, chart interaction, the mobile nav drawer, hover state).
Styling uses the semantic Tailwind tokens defined in `app/globals.css`. Icons are
split strictly by role behind barrels: Heroicons for chrome, Phosphor (`regular`)
for domain/editorial. `AssetImage` (`components/editorial/asset-image.tsx`) is the
single image slot: it renders an optimised `next/image` when an asset is cleared,
otherwise a neutral placeholder, and carries the shared CSS-only hover zoom.

### Market data

Pages never read fixtures directly. The flow is:

```
page (Server Component)
  -> lib/market/service.ts   read layer: caching, freshness, failover, ReadMeta
  -> MarketProvider          lib/market/provider.ts: quotes + history only
  -> mock provider now / real provider later   (selected by MARKET_PROVIDER)
```

Catalogue and editorial content come from a separate `ContentSource`
(`lib/content/source.ts`); the service composes the two. Mock data is the default
and stays visibly labelled indicative / not live. Each read returns a small
`ReadMeta` (provider, source, degraded, safe error code). The service caches
successful reads only; on provider failure it serves last-known-good marked stale,
or an uncached unavailable result, and never leaks raw errors to the client.
Provider selection and secrets are read server-side only, and a live market API is
intentionally gated on approval.

### Enquiries

Form UI (React Hook Form) runs a Zod schema on the client, and the `submitEnquiry`
server action (`lib/enquiries/actions.ts`) re-validates with the same schema on the
server before handing off to an `EnquirySink` (`lib/enquiries/sink.ts`). The default
`log` sink records redacted operational metadata only (no PII); the `disabled` sink
returns a submission error. No live email/CRM delivery exists yet, and references
are non-production DEMO codes.

### Uploads

`lib/uploads/service.ts` defines an upload service seam that is disabled: no
storage, no upload endpoint. The attachment UI is a non-uploading shell. A real,
approved provider plugs in later.

### Content

Catalogue and per-metal detail content are served through `ContentSource` (static
in-repo today, chosen by `CONTENT_SOURCE`). Broader editorial still reads its
`data/config/*` modules directly. A CMS can be added behind the same seam without
changing pages.

## Key routes

- `/` home
- `/markets`, `/markets/[slug]`
- `/trade-logistics`
- `/company`
- `/contact`
- `/enquire/supply`, `/enquire/buying-requirement`, `/enquire/logistics`, `/enquire/general`

`/style-guide` is a development-only reference and is blocked in production.

## Local development

```
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build
npx tsc --noEmit
```

## Environment and config

Every integration defaults to a mock / static / disabled provider, so the app runs
with no environment set. `.env.example` documents the supported selectors
(`MARKET_PROVIDER`, `ENQUIRY_SINK`, `UPLOAD_PROVIDER`, `CONTENT_SOURCE`, plus the
dev-only `MARKET_SIMULATE_FAILURE`). Selectors are validated in a server-only config
module (`lib/config/env.ts`); an unknown value warns and falls back to the default.
No secrets are committed, and live providers require explicit configuration and
approval.

## Current state

- UI and all major routes are implemented and responsive.
- Market experience uses labelled mock/demo values; freshness and provider-failure states are handled.
- Enquiry submission is mocked and seamed for a future CRM/email sink; no live delivery occurs.
- Real market API, CRM/email, file storage, and CMS are not connected yet.
- Some client-supplied imagery and content provenance are still pending verification.

## Docs

`docs/` holds the product blueprint and the design system, which remain the source
of truth for product behaviour and visual decisions.
