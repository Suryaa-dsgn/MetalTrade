# Security & Production Readiness

Hosting-agnostic security reference for the Oriental Energy and Minerals (OEML)
portal. It separates **application-level controls** (implemented in this repo,
portable across any host) from **infrastructure-level controls** (which the eventual
hosting platform MUST provide). Neither replaces the other:

> Application-level security controls are implemented for the identified threat
> model. Infrastructure controls must be configured on the selected production
> platform.

This is not a claim of zero vulnerabilities, complete DDoS protection from
application code, or that the system is unbreakable.

The final hosting platform is **undecided** (AWS, Vercel, Cloudflare-fronted, or
another managed platform). Nothing here hard-codes a vendor; the AWS section is a
reference mapping only.

---

## 1. Application controls (in this repo, portable)

| Area | Control | Where |
|---|---|---|
| Secrets | Server-only config; keys never in client bundle/HTML/logs; provider URLs with key query-params never logged | `lib/config/env.ts`, provider adapters |
| Prod hygiene | `MARKET_PROVIDER=mock` and `MARKET_SIMULATE_FAILURE` force-disabled in production; dev QA params and `/style-guide` gated by `NODE_ENV` | `lib/config/env.ts`, `app/**` |
| Input validation | Per-intent Zod schemas, field-specific `.max()`, `.strict()` (reject unexpected fields); server-side authoritative | `lib/validation/enquiry.ts` |
| Body size | Server Action `bodySizeLimit: 64kb` backstop | `next.config.ts` |
| Output safety | No `dangerouslySetInnerHTML` / `eval` / `child_process`; React auto-escaping | codebase-wide |
| SSRF | Fixed, allow-listed provider base URLs; no user-controlled fetch destination; no generic URL-fetch helper | provider adapters |
| Response validation | Zod + unit cross-check + sanity band + freshness; refuse-don't-publish; only validated live quotes cached/persisted | `lib/market/normalize.ts`, `lib/market/service.ts` |
| Amplification | Provider-aware min fetch interval (L1 cache) + single-flight coalescing | `lib/market/providers/{fetch-policy,single-flight}.ts` |
| Resilience | Per-provider circuit breaker (closed→open→half-open, single probe) | `lib/market/providers/circuit-breaker.ts` |
| Retry | Exactly one, transient-only, jittered | `lib/market/providers/retry.ts` |
| Rate limiting | In-memory limiter on the enquiry action (defense-in-depth, per-instance) | `lib/security/rate-limiter.ts` |
| Bot verification | Disabled no-op seam (no CAPTCHA/vendor code) | `lib/security/bot-verification.ts` |
| Headers | `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, `poweredByHeader: false` | `next.config.ts`, `lib/security/headers.ts` |
| CSP | `Content-Security-Policy-Report-Only` (not enforced) | `lib/security/headers.ts` |
| Logging | Single structured logger; secret-key redaction backstop; no PII/secret URLs | `lib/observability/logger.ts` |
| Correlation | Request-scoped correlation IDs on the enquiry path (no PII) | `lib/observability/correlation.ts` |
| CI gates | tsc/lint/test/build + secret scan + prod audit | `.github/workflows/ci.yml`, `scripts/secret-scan.mjs` |

## 2. Infrastructure requirements (the host MUST provide)

These are **not** implemented in application code and must be configured on the
chosen platform:

- **L3/L4 DDoS** mitigation and **L7 / application DDoS** protection.
- **WAF** with managed/common exploit rule sets.
- **Edge / distributed rate limiting** (the authoritative limiter; the app limiter
  is only defense-in-depth).
- **Bot / challenge** capability (the app has a disabled seam only).
- **TLS** termination and **HSTS** ownership at exactly one layer (see §13).
- **Origin protection** — do not expose the origin directly; only the edge should
  be reachable from the internet.
- **Load balancing + autoscaling.**
- **Centralized logs / metrics / alerting.**
- **Managed secret storage** for provider keys (and any future CRM/email/storage).
- **A durable shared store** when running more than one instance (see §12).

## 3. AWS example (reference only — not required, no code yet)

| Concern | AWS service |
|---|---|
| DNS | Route 53 |
| CDN | CloudFront |
| L3/L4 DDoS | AWS Shield |
| WAF / rate limiting / bot | AWS WAF (+ Bot Control) |
| Load balancing | ALB / platform-equivalent runtime |
| Secrets | Secrets Manager / SSM Parameter Store |
| Shared cache / last-known-good | ElastiCache (Redis) / DynamoDB |
| Durable relational (if justified) | RDS (Postgres) |
| Logs / metrics | CloudWatch |

Reference request path: `Internet → Route 53 → CloudFront → Shield → WAF → ALB →
Next.js`. Equivalent mappings exist on Vercel (managed edge/WAF + Redis/KV/Postgres)
and Cloudflare (Cloudflare edge + Workers KV/D1). **Do not assume AWS until the
client confirms.**

## 4. Secret protection

Keys (`METALPRICE_API_KEY`, `METALS_DEV_API_KEY`, `EIA_API_KEY`, and any future
CRM/email/storage secrets) are read only in `lib/config/env.ts` (`import
"server-only"`), never exported to callers, never `NEXT_PUBLIC_*`, and never logged.
EIA/Metals.Dev put the key in a query param, so those adapters never log the URL.
`.env*` is git-ignored (only the secret-free `.env.example` is tracked). CI runs
`scripts/secret-scan.mjs` after build to fail on any key value, key env-name,
provider host, or `X-API-KEY` appearing in the client bundle or prerendered HTML.
Secret values are never printed by the scanner. **In production, secrets must live
in the host's managed secret store, not in a committed file.**

## 5. Provider protection (amplification, quota, integrity)

Per read, each benchmark routes through the registry → router → adapter. Protection
order in `service.fetchLatest`:

1. **Min fetch interval / L1 cache** — provider-aware (EIA 6h, MetalpriceAPI 3h,
   Metals.Dev 1h). Repeated `/markets` hits are served from cache, so they cannot
   force upstream calls.
2. **Single-flight** — concurrent identical refreshes collapse to one upstream call;
   the key canonicalizes provider + benchmark set.
3. **Circuit breaker** — an unhealthy provider is skipped; last-known-good served.
4. **Bounded retry** — at most one, transient only.

Only validated/normalized/sanity-checked **live** quotes are cached and persisted
(cache-poisoning safety). Malformed/out-of-band data is refused, never stored as
good. Sample data is always labelled and never presented as live; production never
substitutes mock for a failed live benchmark.

## 6. DDoS / WAF / rate-limit split

- **Edge (host):** L3/4 + L7 DDoS, WAF, distributed rate limiting, bot challenge —
  authoritative. Custom DDoS protection is **not** built in Next.js.
- **Application (here):** cache + single-flight + circuit breaker absorb load;
  an in-memory limiter guards the enquiry action as defense-in-depth. Cached GET
  pages and static assets are intentionally **not** app-rate-limited.

## 7. Single-flight & cache

`coalesce(flightKey(providerId, requests), fn)` — concurrent callers with the same
provider + benchmark set share one in-flight promise; the key releases on settle.
Different benchmark sets never share a result. Proven by unit + service tests
(N concurrent reads → 1 provider call).

## 8. Circuit breaker

Per-provider, in-memory. Opens after 3 consecutive failures or immediately on
rate-limit/quota. Cooldown 60s, then a **single** half-open probe (a latch prevents
a burst when cooldown ends); success closes, failure re-opens. **Per-instance only**
— not shared across multiple app instances. Acceptable at this stage; a shared
breaker can follow if operationally justified.

## 9. Retry policy

Exactly one retry, transient codes only (`network`, `timeout`, `server_error`) with
short jittered backoff. Never retries auth, authorization, quota, `rate_limit`
(429), `bad_request`, `malformed`, `not_found`, `paid_gated`, or `unknown`. 429/quota
are handled by the breaker + cooldown, not by retry. Retry + breaker + single-flight
together prevent retry storms.

## 10. Minimum-fetch behaviour

The L1 cache TTL is the min fetch interval, set per provider to respect each feed's
real cadence and never below its update frequency, so cached data that cannot have
changed is not re-fetched.

## 11. Form security

Per-intent Zod schemas: every string field has a field-specific `.max()`; all four
schemas are `.strict()` so unexpected business fields are rejected (not merely
stripped). Quantity is a bounded positive number. Server validation is authoritative;
client validation is UX only. A 64KB Server Action body limit is a coarse backstop
(no uploads exist). Errors are generic; no PII is logged; no raw HTML is rendered; no
open redirects or arbitrary fetches.

## 12. CSRF / request origin

Next.js Server Actions include built-in Origin/Host validation and are POST-only with
an action-id indirection, which is sufficient here: there is **no** authenticated or
privileged session state, no cookies driving privileged actions, and the only
mutation is a non-privileged enquiry submission. No custom CSRF tokens are added.
Residual risk: a successful forged submission would only create a demo-reference
enquiry record (no account, payment, or state change). If authenticated state is
introduced later, revisit `experimental.serverActions.allowedOrigins` and session
CSRF.

## 13. Headers / CSP

Enforced: `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/topics/
payment/usb denied), `X-Frame-Options: DENY`, `poweredByHeader: false`.

CSP is shipped **Report-Only** and built from the app's actual output: same-origin
scripts/styles/fonts (self-hosted Geist), `img-src 'self' data:`, no wildcard script/
connect sources, no `unsafe-eval`. `script-src`/`style-src` include `'unsafe-inline'`
because Next injects per-page inline bootstrap scripts and Recharts injects inline
styles, and there is no nonce middleware yet. Reports go to the browser console.

**Enforcement** (switching to `Content-Security-Policy`) and any nonce-based strict
`script-src` are a separate, deliberate step. **Analytics domains** are intentionally
NOT pre-allowed; Phase 11 adds them when a provider is chosen.

**HSTS** is opt-in (`SECURITY_HSTS=1`, production only, no preload). It is off by
default so it never conflicts with an edge/CDN HSTS policy. **Exactly one layer must
own HSTS**, enabled only after HTTPS is confirmed; preload requires a separate,
deliberate decision.

## 14. Logging / PII

All application logs use the structured logger (`lib/observability/logger.ts`), which
redacts secret-looking keys as a backstop. Never logged: names, emails, phone numbers,
enquiry text/specifications/messages, attachment content, API keys, Authorization
values, or secret-bearing URLs. Useful fields: `event`, `provider`, `benchmarkId`,
failure code, `correlationId`, freshness state. Redaction is a safety net, not a
licence to pass secrets to the logger. In production, logs should ship to the host's
centralized logging.

## 15. Correlation / request IDs

The enquiry write path stamps a short opaque `correlationId` (no PII) across its log
lines (rate-limit, received). Market reads correlate via structured
provider/benchmark/event fields. No distributed-tracing infrastructure and no
AsyncLocalStorage context propagation are introduced (deferred).

## 16. Horizontal-scaling limitations (per-instance state)

The following are **in-memory per instance** and are lost on cold start / not shared
across instances:

- Provider L1 cache and last-known-good (`MarketObservationRepository` in-memory impl)
- Provider health
- Circuit breaker state
- Application rate limiter counters

At scale, **last-known-good** and **distributed rate counters** must become shared
(and scheduled-refresh locks, if introduced). The circuit breaker may remain local.

## 17. Durable market state (design now, implement later)

`MarketObservationRepository` is the seam (`lib/market/repository/`). The current
in-memory implementation does **not** provide durable last-known-good across cold
starts, process restarts, or multiple instances. A future shared durable
implementation (host-dependent: AWS ElastiCache/DynamoDB/RDS; managed Redis/KV/Postgres
elsewhere) plugs in behind the same interface with no `MarketService` change. **No
database/Redis/KV is added in this security work** — that is a separately approved
decision.

## 18. Dependency & framework audit

- `npm audit --omit=dev`: **0 vulnerabilities** (production).
- Two **dev-only** moderate `vitest`/`@vitest/mocker` advisories (path traversal in a
  mock redirect) — not reachable in production. **Documented and accepted; do NOT run
  `npm audit fix --force`** (breaks to vitest@5). A deliberate Vitest upgrade can
  follow after a compatibility review.
- Next 16.3.4 / React 19.2.8 are current; no production source maps; no major
  upgrades recommended.
- Supply chain: `package-lock.json` committed; CI uses `npm ci`; `zod` is a direct
  dependency.

## 19. File uploads (future — disabled)

Uploads are disabled (`UPLOAD_PROVIDER=disabled`); the attachment UI is a shell and no
file bytes reach the server. When enabled later, require: signed URLs, isolated
object store (no public bucket by default), random object keys, size limits, MIME
allow-list, extension validation, malware scanning, and metadata separated from
objects.

## 20. CORS

No external browser API consumer exists, so no permissive
`Access-Control-Allow-Origin: *` is set. Any future API consumer must use an explicit
origin allow-list.

---

## 21. Incident playbook

### API key leak
1. Revoke / rotate the key at the provider immediately.
2. Update the secure environment config (host secret store), not any committed file.
3. Redeploy so instances pick up the new key.
4. Inspect logs for the affected window (no secrets are logged; correlate by event).
5. Invalidate caches where needed (cold start clears in-memory cache/last-known-good).

### Provider outage
1. The circuit breaker opens after repeated failures / rate-limit / quota.
2. Cached / last-known-good is served, marked degraded/stale.
3. The affected benchmark shows unavailable if no good value exists.
4. If prolonged, set that benchmark's routing to `none` / disable its mapping in the
   registry and redeploy.

### Traffic / DDoS attack
- **Infrastructure (host):** tighten edge rate limits, enable WAF / challenge, block
  abusive patterns, protect the origin.
- **Application:** cache + single-flight + circuit breaker continue to absorb load and
  shield provider quotas.

### Form spam
1. Tighten the edge rate limit for the enquiry path.
2. Enable a bot-verification provider via the `BOT_VERIFICATION` seam (currently
   disabled).
3. Inspect abuse patterns; the app limiter provides per-instance defense-in-depth in
   the meantime.

---

## 22. Remaining known risks

- Distributed DDoS, WAF, bot protection, and distributed rate limiting are
  **infrastructure responsibilities** — not solved by application code.
- Cache, last-known-good, circuit breaker, and the app rate limiter are
  **per-instance** until a durable shared store is approved.
- The app rate limiter's client identity is **best-effort/spoofable** unless a trusted
  proxy is asserted (`RATE_LIMIT_TRUST_PROXY`).
- CSP is **report-only**; strict, nonce-based `script-src` enforcement is future work.
- One HSTS owner must be chosen at deployment; preload is a separate decision.
- Dev-only Vitest advisory remains until a deliberate upgrade.
