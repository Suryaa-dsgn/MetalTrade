This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Integration configuration (Phase 10)

External integrations are wired behind **provider seams** with mock / no-op /
disabled defaults, so the app runs fully with **no environment configuration**.
No live provider is connected in this build — each is gated on explicit approval
(see `CLAUDE.md`). Copy `.env.example` to `.env.local` only when you connect an
approved provider; keep real secrets out of the repo.

Selectors are validated against explicit enums in a **server-only** config module
(`lib/config/env.ts`, guarded by `import "server-only"`); an unknown value logs a
warning and falls back to the default. No client module reads provider config or
secrets.

| Env var | Supported (default) | Behaviour today |
|---|---|---|
| `MARKET_PROVIDER` | `mock` (default) | Sample quotes/history behind `MarketProvider`; the market **service** (`lib/market/service.ts`) adds caching, per-feed freshness, and failover. Values stay labelled indicative / not live. |
| `ENQUIRY_SINK` | `log` \| `disabled` (default `log`) | `log` records **redacted** operational metadata only (intent, DEMO reference, timestamp, result) — never PII/message content. `disabled` returns a submission error. No email/CRM. |
| `UPLOAD_PROVIDER` | `disabled` (default) | Upload storage is off; there is **no presign endpoint**. The attachment UI is a non-uploading shell. |
| `CONTENT_SOURCE` | `static` (default) | Catalogue + metal-detail content from in-repo fixtures via `ContentSource`. Kept separate from market data. |
| `MARKET_SIMULATE_FAILURE` | unset (`1`/`true` to enable) | Dev/QA only: forces the market provider-failure path to exercise degraded UI. |

**Failure behaviour:** only successful provider payloads are cached. On failure
the service serves last-known-good data marked *stale* (original timestamps kept)
when available, otherwise an **uncached** unavailable result (em dashes, never a
fabricated figure). Reads return a small `ReadMeta` (`provider`, `source`,
`fetchedAt`, `degraded`, safe `errorCode`) — raw provider errors never reach the
client.

**Intentionally unconnected (until approved + configured):** a live market feed,
email/CRM delivery, file storage, and any CMS SaaS.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
