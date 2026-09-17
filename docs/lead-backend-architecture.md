# OEML Lead Backend Architecture

Design for the unified Contact form's lead-processing backend. A modular-monolith
slice under `lib/leads/`, reusing the codebase's proven patterns (the
`MarketObservationRepository` seam, provider router/adapter model, `env.ts`
server-only Zod selectors with safe defaults, and the redacting logger).

Incorporates the approved amendments: Lead and NotificationDelivery are separate
concepts; the submission repository is minimal and atomic; correlationId is
observability metadata, not business data; provider choice (email/CRM) stays behind
a neutral seam; no full outbox/DB/queue in Phase 2A.

## 1. Recommended architecture

```
Contact form (unchanged)
  → submitContactEnquiry (Server Action; keeps validation + rate limiter + bot seam
    + correlation IDs + redacted logging)
    → LeadSubmissionService.submit(validatedValues, submissionContext)
        1. normalize → Lead (business data only)
        2. LeadRepository.createOrGet(lead)         ← SYSTEM OF RECORD (atomic)
           └─ created here = user-facing success
        3. LeadNotificationService.notify(lead)     ← separate, best-effort
             → NotificationProvider[] (log now; email/CRM/webhook later)
             └─ produces NotificationDelivery records; never fails the submission
    ← EnquiryResult { ok, referenceId = lead.reference }
```

The form and `LeadSubmissionService` never know about email/CRM/provider details.
Persistence is the source of truth; notification is a downstream, retryable
side-effect. Persist-before-notify ordering structurally guarantees "the lead is not
lost if email fails."

## 2. Lead domain model (business data only)

`Lead` contains **only** customer/enquiry data — no delivery/notification state, no
logging infrastructure fields.

```
LeadStatus = "new" | "contacted" | "qualified" | "closed"   // flat labels, no state machine
LeadSource = "contact-form"                                  // extensible later

Lead {
  id: string              // internal, opaque (UUID/ULID) — never exposed
  reference: string       // public, human-friendly OEML-YYYY-XXXXXX, unique
  createdAt / updatedAt: string (ISO 8601 UTC)
  status: LeadStatus      // default "new"
  enquiryType: ContactEnquiryType
  contact: { name; email; phone?; company?; country }
  commodity? / quantity? / origin? / destination?: string
  message: string
  source: LeadSource
  submissionToken: string // idempotency key (§8)
  metadata?: Record<string,string>   // small, non-PII, optional
}
```

**correlationId is NOT a Lead field** — it is observability metadata carried in the
submission context and event logs (§ amendment 5). Lead business data stays
independent of logging infrastructure.

## 3. NotificationDelivery model (separate concept)

Operational delivery state is a **separate** type, so future email + CRM + webhook
deliveries are not forced into one `Lead.notification` object.

```
NotificationChannel = "log" | "email" | "crm" | "webhook"
NotificationDeliveryStatus = "pending" | "sent" | "failed"

NotificationDelivery {
  leadId: string
  channel: NotificationChannel
  provider: string
  status: NotificationDeliveryStatus
  attempts: number
  lastAttemptAt?: string
  lastErrorClass?: string
}
```

Phase 2A keeps this physically simple (produced + logged, not separately persisted).
Future persistence becomes two tables: `leads` and `lead_notification_deliveries`
(one lead → many deliveries across channels). A full generic outbox/queue is
introduced only if multiple channels need independent reliable dispatch, horizontal
workers are added, or stronger async guarantees are required.

## 4. LeadSubmissionService responsibilities

Single orchestration point (`lib/leads/service.ts`), provider-agnostic:

1. Accept **already-validated** contact values + submission context
   (`submissionToken`, `correlationId`, `source`). Validation stays in the schema.
2. Normalize → `Lead` (generate internal id + public reference + timestamps,
   `status:"new"`).
3. **Persist atomically** via `LeadRepository.createOrGet` — the commit point. On a
   public-reference collision it regenerates the reference and retries (bounded).
4. If newly created → **notify** via `LeadNotificationService` (post-persist,
   synchronous log provider in 2A; never fails the submission).
5. Return the lead (the action maps `lead.reference` to `referenceId`).

Pure orchestration → unit-testable with an in-memory repo + fake notifier.

## 5. Persistence recommendation

**Managed PostgreSQL** (Aurora Serverless v2 on AWS; managed Postgres elsewhere).
Low write volume; strong consistency; trivial admin filtering/search/export later;
easy retention/erasure; and `UNIQUE(submission_token)` + `UNIQUE(reference)` give
idempotency and reference-uniqueness atomically. DynamoDB is overkill and awkward for
ad-hoc admin queries; Redis/KV is not a system of record. The choice stays behind
`LeadRepository`, so it is not load-bearing. **No DB is added until Phase 2D is
approved.**

## 6. LeadRepository contract (minimal, atomic)

Phase 2A exposes **only** the write/idempotency contract — no admin methods.

```
CreateOrGetResult = { created: boolean; lead: Lead }
class LeadReferenceCollisionError extends Error {}

interface LeadRepository {
  // Atomic create-or-return-existing, keyed by submissionToken. A public-reference
  // collision with a DIFFERENT lead throws LeadReferenceCollisionError so the caller
  // regenerates + retries. Other failures throw.
  createOrGet(lead: Lead): Promise<CreateOrGetResult>
}
```

- **Atomicity:** the contract is a single atomic operation — NOT
  `findBySubmissionToken()` then `createLead()` (which races). The future Postgres
  impl relies on `UNIQUE(submission_token)` (authoritative) with
  `INSERT … ON CONFLICT (submission_token) DO NOTHING RETURNING …` (or catch the
  unique violation and re-select). The in-memory impl runs its check-and-insert in a
  single synchronous critical section, simulating the same semantics.
- **Future admin/read behavior uses separate interfaces** — e.g.
  `LeadQueryRepository` (list/filter/search/paginate) and `LeadManagementRepository`
  (updateStatus, export). Phase 2A does **not** depend on them, and the submission
  pipeline never imports admin functionality.

## 7. Notification architecture + email provider seam

`LeadNotificationService` dispatches a `Lead` to one or more `NotificationProvider`
adapters:

```
NotificationResult = { ok:true } | { ok:false; code; retryable }
interface NotificationProvider {
  readonly name: string
  readonly channel: NotificationChannel
  isConfigured(): boolean
  notify(lead: Lead): Promise<NotificationResult>
}
```

- Phase 2A ships the **log** provider only (no-op success; current behavior).
- Email/CRM/webhook are future adapters behind the same seam, selected via an env
  selector with a safe `log` default (added when those phases land).
- **Provider is deliberately NOT finalized.** SES and Resend both remain candidates;
  selection waits on final hosting, sending domain, recipient inbox, DNS access, and
  client preference. **No email SDK is added in Phase 2A.**
- Email content (future): subject `New OEML Lead: <Enquiry Type> — <Commodity or
  "General">`; body carries Reference, Submitted at, Name, Company, Email, Phone,
  Country, Enquiry Type, Commodity, Quantity, Origin, Destination, Message. PII only
  to the trusted internal inbox, never in logs.

## 8. Idempotency strategy

**Client-generated `submissionToken`** (one per mounted form instance; regenerated
after a successful submit), enforced atomically by the repository (in-memory now,
`UNIQUE(submission_token)` in Postgres later). A retry with the same token returns
the existing lead (`created:false`) — no duplicate lead, no duplicate notification.
Covers client retries, network retries, browser double-submit, and backend retries.

**Phase 2A note:** the Contact form does not send a token yet (that one UI change is
Phase 2B), so 2A generates a server-side token per request — the atomic contract and
its tests exist, but real cross-request de-duplication begins with the client token
in 2B.

## 9. Public reference strategy

- **Internal id:** opaque UUID/ULID — never exposed, never a sequential DB id.
- **Public reference:** `OEML-YYYY-XXXXXX` (year + 6 unambiguous chars). Uniqueness is
  enforced (a `UNIQUE(reference)` constraint later; an in-memory set now). **Six
  random characters can collide**, so on collision the service **regenerates and
  retries** (bounded), rather than assuming uniqueness.

## 10. Failure behavior matrix

| Scenario | User sees | Logged (no PII) | Retry | Lead exists? |
|---|---|---|---|---|
| Validation failure | Inline field errors | `lead.submission.rejected` reason=validation | No | No |
| Rate-limit rejection | "…wait a few minutes" | `lead.submission.rejected` reason=rate_limit | No | No |
| Bot-verification failure | Generic "couldn't verify" | `lead.submission.rejected` reason=bot | No | No |
| Persistence failure | Generic "try again" | `lead.persist.failed` (error class) | Ref-collision regenerates (bounded); other transient DB error → later phases | No |
| Notification fails after persist | **Success** | `lead.notification.failed` | Later phases (2A log can't fail) | **Yes** |
| Duplicate / idempotent retry | **Success, same reference** | `lead.duplicate.detected` | None | Yes (original) |
| Unexpected server error | Generic "try again" | `lead.submission.error` (class; stack server-only) | No auto-retry; token makes retry safe | Maybe |

## 11. Success boundary

Success is shown **only after the lead is persisted** (`createOrGet` returns). Email
delivery does **not** gate success. In Phase 2A the log provider is synchronous
because it is trivial — **no unsafe fire-and-forget background promises**. Real async
notification/retry (and avoiding long provider timeouts on the request path) is a
later phase. Because 2A persists in memory only, the dev-only success note continues
to state that live delivery / persistent production storage is not connected yet.

## 12. Retry / job strategy

Deferred to later phases. Target: one bounded synchronous retry on the request path
for transient notification failures, then a durable `pending` re-attempt
(`lead_notification_deliveries`) driven by a scheduled task; upgrade to a real
queue/worker (e.g. SQS + worker) when volume, multiple channels, or horizontal scale
require it. Phase 2A does none of this.

## 13. Security / privacy controls

Preserve all existing hardening. Future additions: server-only secrets (DB URL, email
creds) via `env.ts`; no PII in logs (opaque `leadId`/`reference`, enquiryType,
commodity, status, provider, failure class, correlationId only); no secret-bearing
URLs; bounded + strict schema unchanged; rate limiter + bot seam + Server Action
Origin/Host CSRF unchanged; fixed allow-listed provider endpoints (no arbitrary
fetch/SSRF); least-privilege DB creds; TLS to DB and email API; encryption at rest;
verified webhook signatures.

**Data retention / privacy:** store only qualifying fields (above) + timestamps /
status / reference. **Do not store raw IP** (only a transient best-effort rate-limit
key). No financial/identity documents. Retention is **not indefinite** — a placeholder
policy (review/anonymize after inactivity) applies until client/legal confirms, with
hard-delete/anonymize supported for erasure requests.

## 14. Observability events

PII-free structured events via the existing logger: `lead.submission.started`,
`lead.reference.collision`, `lead.created`, `lead.persist.failed`,
`lead.duplicate.detected`, `lead.notification.sent`, `lead.notification.failed`,
`lead.submission.rejected` (reason), `lead.submission.error`. Fields: correlationId,
opaque leadId/reference, enquiryType, commodity, status, channel, provider, failure
class, attempts. Never message body, email, phone, name, or IP.

## 15. Future CRM seam

A CRM is another `NotificationProvider` (or parallel `providers/crm/*`) added to the
dispatch list and selected by env — no change to the Contact form or
`LeadSubmissionService`. HubSpot/Salesforce/Zoho/custom-webhook each become an adapter
with its own auth/idempotency/retry, reading a persisted lead.

## 16. Future admin/dashboard compatibility

Admin behavior uses separate `LeadQueryRepository` / `LeadManagementRepository`
interfaces (list/filter/search/paginate; updateStatus; export) — not the submission
`LeadRepository`. The `Lead` model already carries status + timestamps + enquiryType +
commodity for filtering. Reads/writes stay separated, so an admin surface never
touches the submission pipeline.

## 17. Files / modules

Phase 2A adds `lib/leads/{types,reference,normalize,service}.ts`,
`lib/leads/repository/{types,memory,index}.ts`,
`lib/leads/notification/{types,service}.ts` +
`lib/leads/notification/providers/log.ts`, and rewires
`submitContactEnquiry` in `lib/enquiries/actions.ts` to call the service. Later phases
add the Postgres repository, email/CRM adapters + env selectors + secrets, retry/job
handling, and admin read interfaces.

## 18. Implementation phases (actual sequence)

This is the single authoritative sequence. (An earlier draft had 2C/2D swapped —
email vs Postgres; that stale numbering has been removed.)

- **2A (done):** domain types, reference generation, normalization, minimal atomic
  `LeadRepository` + in-memory impl + factory, `LeadSubmissionService`,
  `NotificationProvider` seam + log provider, integration into
  `submitContactEnquiry`. In-memory only; no external deps.
- **2B (done):** client `submissionToken` (the one form change) + reference/
  idempotency end-to-end + production ephemeral-store safety + observability polish.
- **2C (done):** durable Postgres `LeadRepository` (unique constraints, atomic
  `ON CONFLICT`, fail-closed factory). See §20.
- **2D (done — this phase):** email notification FOUNDATION behind the existing
  `NotificationProvider` seam — provider-neutral email model, deterministic content
  builder, `EmailTransport` abstraction, fake transport, fail-loud provider
  selection, server-only config. NO email SDK/vendor wired yet. See §21.
- **2E:** durable notification delivery/retry (bounded sync retry + a durable
  `pending` re-attempt via `lead_notification_deliveries`); outbox/queue only if
  warranted.
- **2F:** CRM adapter, admin read/query interfaces, retention/anonymization.

## 19. Questions requiring approval (for later phases)

Platform + Postgres confirmation (2D); email provider + sending domain + recipient
inbox + DNS (2C); retention duration and legal basis/consent record; CRM target;
whether a scheduled task is acceptable for `pending` re-attempts (2E).

---

## 20. Phase 2C — durable PostgreSQL persistence (implemented)

Replaces the production limitation of the in-memory store with a durable Postgres
`LeadRepository`. Notification remains the log provider — no email/CRM/queue.

### Technology
- **`pg` (node-postgres)** with **explicit parameterized SQL** — no ORM. The
  repository is one atomic `INSERT … ON CONFLICT` + row mapping; Prisma (engine
  binary) / Drizzle (codegen) are unjustified weight. `pg` is portable across all
  managed Postgres, supports pooling, and needs no build step.
- **`@electric-sql/pglite`** (devDependency) — in-process WASM Postgres — runs the
  real adapter SQL (constraints, `ON CONFLICT`, `23505`) in integration tests with
  no infra, behind a tiny `SqlExecutor` port.

### Schema (`db/migrations/0001_create_leads.sql`)
`leads`: `id UUID PK`, `reference VARCHAR(32)`, `submission_token VARCHAR(64)`,
`created_at/updated_at TIMESTAMPTZ`, `status VARCHAR(16) DEFAULT 'new'`, `enquiry_type`,
`contact_name/contact_email/country` (NOT NULL), `contact_phone/company/commodity/
quantity/origin/destination` (nullable), `message VARCHAR(4000) NOT NULL`, `source`.
Constraints: `leads_reference_unique`, `leads_submission_token_unique`, and CHECKs on
`status` and `enquiry_type` (the DB defends the domain, not only TypeScript). No
`correlationId`, IP, user-agent, or bot token stored.

### Repository + atomic createOrGet
`lib/leads/repository/postgres.ts` implements the existing `LeadRepository` over an
injected `SqlExecutor`. `createOrGet`:
`INSERT … ON CONFLICT ON CONSTRAINT leads_submission_token_unique DO NOTHING RETURNING *`
— a returned row ⇒ `created:true`; no row ⇒ token already existed ⇒ `SELECT` and return
it (`created:false`). A `reference` clash is a different unique constraint (not the
conflict target) ⇒ raises `23505` on `leads_reference_unique` ⇒ throws
`LeadReferenceCollisionError`, which `LeadSubmissionService` resolves by regenerating
the reference and retrying (bounded to 5). Token conflicts are never mistaken for
reference conflicts. The in-memory repository remains for unit tests / explicit local
selection and is never deleted.

### Factory + fail-closed
`getLeadRepository()` selects by validated `LEAD_STORE` (`memory` | `postgres`); there
is **no silent fallback** to memory. Production safety: the service rejects any
non-`durable` repository in production (via the `durability` capability); a `postgres`
selection with no `DATABASE_URL` fails every query (fail closed) rather than losing
leads. Memory = `ephemeral`, Postgres = `durable`.

### Connection + config
One module-level `pg.Pool` per instance (reused across requests, small `max`,
serverless-friendly), TLS controlled by `DATABASE_SSL` (`require` default). All DB
config is server-only via `lib/config/env.ts` (`DATABASE_URL` is a `secret`, never
logged / never client-exposed). Only parameterized queries.

### Migrations
Versioned `.sql` files in `db/migrations/` applied by `scripts/migrate.mjs`
(`npm run db:migrate`), tracked in `schema_migrations`, each in a transaction. Never
run at startup or on the request path. `*.down.sql` are for deliberate manual
rollback. Workflow: add `NNNN_name.sql` (+ optional `.down.sql`) → `npm run db:migrate`
locally → run the same in deploy (a release step, not app boot).

### Local development
A local Postgres (e.g. `postgres://localhost:5432/oeml?…`, `DATABASE_SSL=disable`) or a
free managed dev DB (Neon/Supabase). Set `LEAD_STORE=postgres` + `DATABASE_URL` in
`.env.local`, run `npm run db:migrate`, then `npm run dev`. Unit/integration tests
need no external DB (PGlite runs in-process). No Docker is required.

### Failure semantics (unchanged contract, now durable)
validation/rate-limit/bot rejection → no DB call, no lead. Postgres unavailable /
insert failure → no success, generic temporary error, non-PII log. Token retry → same
lead + reference, no second notification. Reference collision → regenerate + bounded
retry. Persist success → submission succeeds, then the log notifier runs; notification
failure never revokes a persisted success.

### Production activation checklist (NOT yet live)
Provision Postgres → `npm run db:migrate` applied → server-only `DATABASE_URL`
(+ `DATABASE_SSL=require`) set → `LEAD_STORE=postgres` → TLS confirmed → submission
smoke test. Until all hold, production continues to fail closed. Email/CRM remain out
of scope (later phases).

### Preserved Postgres production-readiness notes (carried into 2D)
1. **PGlite is CI/integration only.** `@electric-sql/pglite` runs the real adapter
   SQL in tests with no infra, but a **real managed PostgreSQL must receive a
   pre-production smoke test** before production activation — PGlite is not a
   substitute for validating the actual managed instance.
2. **TLS certificate validation.** When the managed provider is selected, verify the
   TLS certificate chain. Do **not** use `rejectUnauthorized:false` (or any
   equivalent verification-disabling shortcut) to silence a certificate error;
   `DATABASE_SSL=require` must mean verified TLS.
3. **Fail early on missing DB config.** With `LEAD_STORE=postgres` but required DB
   configuration missing, prefer failing early where practical rather than degrading
   silently; runtime DB failures must still be handled safely (no lead loss, no
   silent fallback to memory).

---

## 21. Phase 2D — email notification foundation (implemented)

Builds the internal trade-desk email-notification architecture behind the EXISTING
`NotificationProvider` seam (§7). It does **not** wire a real email vendor, send
customer acknowledgement emails, add CRM, an admin UI, a queue/worker, or persistent
retry — all out of scope. No Postgres change. No Contact UI change.

### Core boundary (unchanged)
PostgreSQL remains the system of record. Success = **lead durably persisted**. Email
is a downstream notification; an email failure NEVER deletes or invalidates a
persisted lead. Notification runs only for a newly `created` lead, so a duplicate/
idempotent submission never sends a second email.

### Dependency direction (preserved)
```
Contact UI → submitContactEnquiry → LeadSubmissionService → LeadRepository
LeadSubmissionService → LeadNotificationService → NotificationProvider
                                               → (email) EmailNotificationProvider
                                                   → EmailTransport (SES/Resend later)
```
The UI and `LeadSubmissionService` import no email SDK, credentials, or transport.
`LeadSubmissionService` contains no provider-specific email code.

### Two layers, one trust boundary
- **`EmailNotificationProvider`** (`lib/leads/notification/email/provider.ts`) — the
  only layer that knows a `Lead`. Maps `Lead → EmailMessage` (via the content
  builder), sends through an `EmailTransport`, maps the transport result to the
  seam's `NotificationResult`, and normalizes any thrown error into a safe typed
  failure. `channel:"email"`.
- **`EmailTransport`** (`lib/leads/notification/email/types.ts`) — knows only an
  `EmailMessage`; never receives a `Lead`. Future SES/Resend adapters implement this
  and stay isolated from the lead domain. `send(message, options?)` where `options`
  may carry an `AbortSignal`.

### Email message model (provider-neutral)
`EmailMessage { to; from; replyTo?; subject; text; html? }`. **`from`/`to` come only
from validated server configuration; lead-controlled input never influences from/to
(nor CC/BCC — not added this phase).** `replyTo` is optional and, when enabled, is the
lead's ALREADY-VALIDATED email, passed as a structured field (never a hand-built
header). The lead supplies body content and subject inputs only.

### Content ownership (pure/deterministic)
`content.ts` is presentation ONLY — no persistence, status, retry, provider
selection, or env access. `buildLeadEmail(lead, config)` is pure.
- **Subject:** `New OEML Lead: <Type> - <Commodity or General>` using CONTROLLED
  values: a fixed enquiry-type label map, and the canonical catalogue display name
  for commodity (`other` → "Other"; absent → "General"). No name/email/company/
  message in the subject (predictable + avoids PII exposure).
- **Body (plain text + restrained HTML):** Reference, Submitted at, Enquiry Type,
  Commodity, Name, Company, Email, Phone / WhatsApp, Country, Quantity, Origin,
  Destination, Requirement details. Absent optional fields are omitted cleanly (never
  `undefined`/`null`). HTML is transactional and email-safe (one table, system fonts,
  minimal inline styling, no remote images, no JavaScript, no tracking pixels) — it
  does not recreate the website design system.

### HTML escaping / injection safety
Every lead-controlled value rendered into HTML passes through `escapeHtml` (`escape.ts`)
— leads are untrusted content even after validation (validation bounds shape/length,
it does not neutralize markup). Prevents HTML injection. Plain text is body-only and
never used to build raw headers. Transports receive structured fields, so header
injection and arbitrary-recipient manipulation are structurally prevented.

### Provider selection — fail-closed AND fail-LOUD
Config selector `EMAIL_PROVIDER` = `none | ses | resend` (default `none`).
- `none` → email intentionally DISABLED. The `EmailNotificationProvider` is **not
  registered** (so no misleading per-lead failure events); the log provider keeps
  operating. Sender/recipient are not required. The app starts normally.
- `ses | resend` → must be operational. No transport adapter is implemented in this
  phase (vendor not approved), so `createEmailTransport` throws
  `UnsupportedEmailProviderError`. This is surfaced **loudly** as
  `lead.notification.email.misconfigured` (error level) and the email provider is
  left unregistered — it is **never silently downgraded to `none`**, and never
  treated as an ordinary delivery outcome. This prevents the dangerous state where an
  operator sets `EMAIL_PROVIDER=ses`, believes email is on, and the app quietly sends
  nothing. Same fail-closed principle as lead persistence; misconfiguration never
  breaks lead capture (the registration builder catches and logs, never throws on the
  persist path). A future adapter registers itself in `IMPLEMENTED_TRANSPORTS` and,
  once supported, missing `EMAIL_FROM`/`EMAIL_TO` raises `EmailConfigError`.

### Delivery result semantics (distinct states)
`EmailSendResult = sent | temporary_failure | permanent_failure | not_configured`
(typed; never thrown strings). Mapped to `NotificationResult`: sent → ok; temporary →
retryable failure; permanent → non-retryable failure; not_configured → non-retryable.
**`not_configured`** (a registered transport lacking what it needs at send time) is
DISTINCT from the intentionally-DISABLED `none` state (no provider registered) and
from an UNSUPPORTED/misconfigured provider (surfaced loudly at construction). These
three are not collapsed.

### Configuration (server-only; no new secrets)
`lib/config/env.ts` adds `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_TO` (validated only
when a provider is selected — never required for `none`), and `EMAIL_REPLY_TO`
(`disabled | lead-email`, default `disabled`). No `NEXT_PUBLIC` email config. **No
real provider credential variables are added** (no `RESEND_API_KEY`, AWS/SMTP creds)
because no SDK is implemented — they land with the adapter. Addresses/keys are never
logged as values.

### Timeouts (bounded; honest about cancellation)
The provider races `transport.send()` against a bounded timer (default 10s) so a
hanging transport can never hang a submission; a timeout returns a typed
`temporary_failure`. **A `Promise.race` timeout does NOT cancel the underlying
request** — a timed-out send could still complete (and, once a real transport exists,
still deliver). The `EmailTransport` contract therefore also accepts an `AbortSignal`
so a future SDK transport can cooperatively cancel where supported, and the provider
aborts the signal on timeout. There is **no automatic retry** in this phase, so a
timeout cannot trigger a second send.

### Logging (PII-free)
Events: `lead.notification.started`, `lead.notification.sent`,
`lead.notification.failed` (with `channel`, `provider`, `attempt`, failure class,
`correlationId`, opaque `leadId`). Misconfiguration is `lead.notification.email.
misconfigured` (a configuration state — NOT a delivery `failed` event). Intentional
`none` produces no email event at all. Never logged: lead email, name, phone,
message, rendered HTML/text body, recipient addresses, or credentials.

### Current durability limitation (accepted for 2D)
`NotificationDelivery` stays separate from `Lead`; no notification field is added
back to the `Lead` model, and deliveries are **not persisted durably** yet. Delivery
is synchronous on the request path with no fire-and-forget promise. **A process crash
after lead persistence but before email delivery can leave a lead with no email
notification.** That gap is accepted for 2D and is exactly what **Phase 2E** closes
with durable delivery/retry (bounded sync retry + a durable `pending` re-attempt in a
`lead_notification_deliveries` table, upgrading to a queue/worker only if warranted).

### Files (Phase 2D)
`lib/leads/notification/email/{types,escape,content,factory,provider,registration}.ts`
+ `transports/fake.ts` (test-only) + their `*.test.ts`; email selectors in
`lib/config/env.ts`; email provider registered in
`lib/leads/notification/service.ts` (`buildDefaultNotificationProviders`).

### What remains before real email can be activated
Approve a vendor (SES vs Resend) with sending domain + DNS (SPF/DKIM/DMARC) +
recipient inbox → add that transport adapter (its SDK + credential env vars) and
register it in `IMPLEMENTED_TRANSPORTS` → set `EMAIL_PROVIDER`, `EMAIL_FROM`,
`EMAIL_TO` (+ `EMAIL_REPLY_TO` if used) → verify send in staging. Until then email
stays disabled (`none`) or fails loudly if a provider is selected without an adapter.

### What remains for reliable persistent notification retries (Phase 2E)
Persist `NotificationDelivery` (`pending`/`processing`/`sent`/`failed` + attempts) so a
crash between persist and send is recoverable; add bounded retry + backoff plus a
durable scheduled drain with safe row claiming; add real transport cancellation via the
`AbortSignal` seam; upgrade to a queue/worker only when volume or multiple channels
require it. Full design: `docs/phase-2e-durable-notification-delivery-design.md`.

---

## 22. Phase 2E — durable notification delivery (design; 2E-1 implemented)

Full design and rationale live in
`docs/phase-2e-durable-notification-delivery-design.md`. The load-bearing decisions,
recorded here as canon:

- **Transactional outbox, truly atomic.** The delivery INTENT row is written in the
  **same Postgres transaction** as the lead (`BEGIN` createOrGet + createIntent
  `COMMIT`; `ROLLBACK` if either fails) — never "lead commit, then intent insert". The
  service orchestrates via a driver-agnostic `SqlExecutor.transaction(...)` Unit of
  Work and holds NO raw SQL. Memory/PGlite model the same atomic semantics.
- **Delivery identity = lead + channel + PURPOSE.** A dedicated
  `lead_notification_deliveries` table with `UNIQUE (lead_id, channel, purpose)` (NOT
  `(lead_id, channel)`), so a lead may have several notifications on one channel over
  time. Purpose `internal_lead_alert` is the only one in 2E;
  `customer_acknowledgement` / `assignment_alert` are future (not built). Intent
  creation is idempotent via `ON CONFLICT (lead_id, channel, purpose) DO NOTHING`.
- **System of record unchanged; success still gated only on durable lead persistence.**
  Notification never invalidates an accepted lead; notification state never returns to
  the `Lead` entity.
- **Provider idempotency is capability-based, never assumed.** `EmailTransport` gains
  `capabilities.idempotentSend`. An ambiguous timeout is auto-retried (with the stable
  delivery-id key) ONLY when `idempotentSend=true`; otherwise it is classified for
  operator recovery, not blindly retried. AWS SES `SendEmail` is not assumed
  idempotent; a Resend-style key-enforcing transport may be.
- **Disabled vs misconfigured.** `EMAIL_PROVIDER=none` → NO intent row created. A real
  provider that is temporarily unusable/misconfigured → the `pending` intent is
  PRESERVED (never discarded) for the durable drain to process once fixed; a
  configuration problem is **not** counted as a delivery attempt.
- **Claim only sendable deliveries.** Because claiming increments `attempts`, the drain
  must not claim rows whose provider is currently unavailable/misconfigured — so
  `attempts` always counts real delivery attempts.
- **PII stays only in `leads`.** The delivery row holds no PII (content is rebuilt at
  send time); `ON DELETE CASCADE` ties deliveries to their lead for erasure/retention.
- **No new infra.** Postgres-as-queue via `FOR UPDATE SKIP LOCKED` + a scheduled drain;
  no Redis/SQS/worker until a concrete throughput/fan-out/SLA signal appears.

### Persistent NotificationDelivery schema (0002)
`lead_notification_deliveries`: `id UUID PK`, `lead_id UUID NOT NULL` (FK →
`leads(id) ON DELETE CASCADE`), `channel`, `purpose`, `provider`,
`status` (`pending`/`processing`/`sent`/`failed`, CHECK), `attempts INT DEFAULT 0`,
`next_attempt_at`, `last_attempt_at`, `last_error_class`, `provider_message_id`,
`locked_at`, `locked_by`, `created_at`, `updated_at`. `UNIQUE (lead_id, channel,
purpose)`. Partial indexes: `(next_attempt_at) WHERE status='pending'` and
`(locked_at) WHERE status='processing'`, plus `(lead_id)`. NO PII columns.

### 2E-1 scope (implemented)
Migration `0002`; persistent delivery types + repository port + Postgres/memory impls
+ mapping; the `SqlExecutor.transaction` Unit of Work; the atomic lead + intent
transaction in the service; intent idempotency; PII-free observability. **Not yet:**
retry/backoff, claiming, scheduler/drain, provider SDK, real-send changes, retention,
CRM, admin, queue. The Phase 2D best-effort first-attempt path is unchanged.

### 2E-2 scope (implemented) — first-attempt outcome persisted
The persisted `pending` intent now drives a bounded FIRST send whose OUTCOME is
written back onto the delivery row. Scope is strictly `pending → attempt → persist`
(no scheduler, cron, drain, claiming, lease, retry loop, queue, worker, CRM, admin, or
real SDK).

- **Transitions (explicit, no generic update):** `markSent` (status→sent,
  provider_message_id, error cleared), `markRetry` (status→pending, `next_attempt_at`
  from backoff — DATA ONLY, no scheduler), `markFailed` (status→failed). Each
  increments `attempts` exactly once. No `processing` state is used in this slice
  (introduced with claiming/lease in the drain slice), so a handled outcome can never
  leave a row stuck.
- **Attempt accounting:** `attempts` counts REAL provider sends only. Disabled
  (`EMAIL_PROVIDER=none` → no intent), misconfigured/unsupported provider, and intent
  creation NEVER increment it — a misconfiguration preserves the `pending` intent, emits
  a loud `lead.notification.email.misconfigured`, and makes no attempt, so the row is
  processable once configuration is fixed.
- **Capability-based ambiguity (timeout / exception):** the send races a bounded timer
  (`sendWithTimeout`, shared with the 2D provider). An ambiguous outcome is auto-retried
  (status→pending, backoff) ONLY when `transport.capabilities.idempotentSend === true`,
  reusing the stable delivery `id` as the provider idempotency key; otherwise it is
  marked `failed` with `ambiguous_*` for operator recovery. SES-style transports are
  not assumed idempotent.
- **Success boundary unchanged:** the attempt runs post-commit and is awaited (it may
  extend request latency) but is best-effort — a sent/failed/timed-out outcome never
  changes an already-successful submission. No detached promise.
- **Email moved off the ephemeral seam:** `buildDefaultNotificationProviders` now
  returns only the `log` heartbeat; email is delivered durably via the outbox, so there
  is no double send.
- **Backoff:** pure `backoff.ts` — exponential, full jitter, cap 1h, `MAX_ATTEMPTS=6`
  (the multi-attempt enforcement belongs to the drain slice; 2E-2 only records the next
  time as data).
- **Logging:** `lead.notification.started` / `.sent` (+ providerMessageId) / `.failed`
  (+ failureClass) / `.retry.scheduled` (+ nextAttemptAt), all PII-free.

### 2E-3 scope (implemented) — durable drain + crash recovery
Reliable notification delivery is now COMPLETE at the application/infrastructure level.
A host-agnostic drain recovers and delivers rows that are pending-and-due or
processing-with-an-expired-lease, safely across multiple instances.

- **`claimDue` (atomic):** `LeadNotificationDeliveryRepository.claimDue({ batchSize,
  workerId, leaseDurationMs, now, sendableProviders })` returns claimed rows (each
  flagged `reclaimed`). Postgres uses a CTE that `SELECT … FOR UPDATE SKIP LOCKED`
  (concurrent drainers get disjoint rows) then transitions them to `processing` with
  `locked_at`/`locked_by`. **Claiming never increments `attempts`** (claiming is not a
  send). The in-memory repository models the same claim/lease semantics for tests.
- **Due / expired rules:** pending is claimable when `next_attempt_at <= now`;
  processing is reclaimable when `locked_at < now - leaseDuration` (crash recovery — no
  startup reset job). Active leases are skipped.
- **Claim only sendable providers:** the drain resolves currently-operable providers
  first; a disabled or misconfigured provider yields an empty set (loud
  `lead.notification.email.misconfigured` for misconfig), so pending rows are
  PRESERVED, unclaimed, and `attempts` is not consumed.
- **Constants:** `DEFAULT_BATCH_SIZE=10`, `DEFAULT_LEASE_MS=60_000` (comfortably >
  the 10s send timeout), module constants (not env) until an operational need arises.
- **Worker id:** opaque per-invocation `crypto.randomUUID()` — operational metadata
  only, never host/user detail.
- **Dispatcher (`drainNotificationDeliveries`, no raw SQL):** determine sendable →
  claim a small batch → per row: load the lead via the internal `LeadReader.getById`
  (the delivery table holds no PII), run the SAME attempt core as the first attempt
  (`attemptEmailDelivery`, reusing the bounded send, capability handling, backoff,
  transitions, and `delivery.id` as the idempotency key), and return a minimal summary
  `{ claimed, sent, retryScheduled, failed }`. A missing lead is failed with
  `lead_not_found` (defensive; FK+CASCADE should prevent it).
- **MAX_ATTEMPTS=6:** a row at the cap is not sent (`lead.notification.exhausted`); a
  retryable result that would exhaust the cap is failed instead of scheduling an
  unreachable retry. Every handled outcome clears the lease (never stuck `processing`).
- **Protected entry point:** `POST /api/internal/notifications/drain` — a THIN route
  that authorizes a `Authorization: Bearer <NOTIFICATION_DRAIN_SECRET>` (constant-time
  compare; missing/unconfigured/wrong → 401; secret server-only, never logged, never in
  a query string, no `NEXT_PUBLIC`), mints a worker id, calls the drain, and returns
  only operational counts. All logic lives in the handler/dispatcher.
- **Observability (PII-free):** adds `lead.notification.claimed` / `.reclaimed` /
  `.exhausted` / `.drain.completed` (with workerId + counts) to the existing
  started/sent/failed/retry.scheduled events.
- **Scheduler NOT wired:** the deployment platform is still undecided, so no Vercel
  Cron / EventBridge / GitHub Actions is attached — only the protected, host-agnostic
  endpoint exists. A platform scheduler is attached at deployment/handover.

**Remaining before real email actually sends:** approve an email vendor and implement
its `EmailTransport` adapter (SDK + credentials, `capabilities.idempotentSend`),
register it in `IMPLEMENTED_TRANSPORTS`, set `EMAIL_PROVIDER`/`EMAIL_FROM`/`EMAIL_TO`,
and attach a platform scheduler to the drain route. (Resend is now that adapter — §23.)

---

## 23. Real email provider — Resend (implemented; dev/staging)

The first concrete `EmailTransport` is **Resend** (`resend` SDK, v6.28.1). It plugs
into the EXISTING architecture — `EmailNotificationProvider` → `ResendEmailTransport`
→ Resend API — with NO second pipeline. The provider stays replaceable: anything
implementing `EmailTransport` (a future SES adapter, etc.) can take its place behind
the same seam.

### Transport
- `lib/leads/notification/email/transports/resend.ts` — `createResendTransport(apiKey,
  client?)`. Knows only `EmailMessage` + `EmailSendOptions` (never a `Lead`).
  `capabilities.idempotentSend = true`. The optional `client` lets tests inject a fake
  `resend.emails` (the SDK is mocked in CI — no live account needed).
- **Idempotency:** `EmailSendOptions.idempotencyKey` (the stable `delivery.id`) is
  forwarded to Resend's `emails.send(payload, { idempotencyKey })` (sent as the
  `Idempotency-Key` header). Same key on every retry for a logical delivery — no new
  scheme.
- **providerMessageId:** on success the Resend email id (`data.id`) is returned as
  `providerMessageId` and persisted by `markSent`.
- **Result mapping:** `data.id` → `sent`; a Resend error → `temporary_failure` for
  transient/capacity codes (`rate_limit_exceeded`, `*_quota_exceeded`,
  `application_error`, `internal_server_error`, `concurrent_idempotent_requests`, or a
  5xx/429 status) and `permanent_failure` otherwise (validation, auth, bad address,
  not-found …). Only the short Resend error-code NAME is used as the classification —
  **never the raw provider message/body**. Neither data nor error → transient
  `malformed_response`. A thrown network error is normalized to `transport_exception`
  by `sendWithTimeout`.
- **Timeout / cancellation:** reuses `sendWithTimeout` (no new timeout path). The
  Resend SDK does not accept an `AbortSignal`, so a timed-out request is not truly
  cancelled — the bound only caps how long a submission waits; provider idempotency
  keeps a later retry safe. Documented limitation, not worked around.

### Registration + fail-early
`createEmailTransport` (`factory.ts`) now builds Resend for `EMAIL_PROVIDER=resend`,
reading server-only `RESEND_API_KEY`; a missing key throws `EmailConfigError`
(fail loud). `ses` still throws `UnsupportedEmailProviderError`. `none` registers no
transport. Missing `EMAIL_FROM`/`EMAIL_TO` under a selected provider also fails loudly
(surfaced as `lead.notification.email.misconfigured`, pending rows preserved, no
attempt consumed). A misconfiguration NEVER destroys an accepted lead.

### Configuration (server-only)
`EMAIL_PROVIDER=resend`, `RESEND_API_KEY` (secret — never logged / client-exposed /
returned from a route / `NEXT_PUBLIC`), `EMAIL_FROM`, `EMAIL_TO`, `EMAIL_REPLY_TO`
(`lead-email` puts the lead's validated email in Reply-To only; never From/To). All
addresses/keys are environment configuration — nothing hard-coded. `EMAIL_PROVIDER=none`
remains the safe default.

### Domain verification (two testing modes)
- **A — initial Resend testing:** use a Resend sandbox/verified test sender the current
  account allows as `EMAIL_FROM`, and a developer/manager inbox as `EMAIL_TO`.
- **B — production/domain testing:** after the client grants DNS access and the OEML
  sending domain is verified in Resend. This requires DNS records: **SPF**, **DKIM**
  (Resend-provided), and a recommended **DMARC** policy. This repo makes NO DNS changes
  automatically.

### Safe test send
`npm run email:test` (`scripts/email-test.mjs`) sends ONE clearly-labeled connectivity
test through Resend using the configured environment. It refuses `NODE_ENV=production`,
takes the recipient from `EMAIL_TO` (no arbitrary/public recipient input), never prints
`RESEND_API_KEY`, and prints only the outcome (`providerMessageId` or an error code).
It is a credential/domain check — the live lead flow sends via the app transport, not
this script. There is no public email-testing endpoint. Provide env in the shell or via
`node --env-file=.env.local scripts/email-test.mjs`.

### Client handover / ownership
For production the **client should own the Resend account/project**. The development
team uses delegated access or a production API key supplied via secrets. Any developer
key used for dev/staging must be **rotated at handover**. Do not tie production
permanently to a developer's personal Resend account. The transport seam means
switching accounts (or vendors) is a config/adapter change, not a code rewrite.

### Still gated on approval / infra
A **platform scheduler** for the drain route is still not wired (deployment undecided),
and durable Postgres lead storage still needs provisioning (§ activation checklist).
Live email requires a real `RESEND_API_KEY` + verified sender; until then the pipeline
is exercised end-to-end with a mocked SDK in tests and produces no live mail.

---

## 24. CURRENT LIVE FLOW — email-only lead delivery (no database)

This is the flow the deployed app actually runs today. It supersedes the persist-first
outbox as the LIVE path; the outbox machinery (§20–§23) remains in the repo but is
**dormant** (not called by the Contact action) and is the intended home for a future
DB/CRM sink.

```
Visitor
→ OEML Contact form (unchanged UX)
→ submitContactEnquiry (Next.js Server Action)
→ rate limit + bot seam + correlation ID
→ Zod (bounded, strict, conditional) re-validation
→ submissionToken validated (UUID-shaped) → used as the Resend idempotency key
→ buildLead(...) normalizes to a Lead-shaped object (IN MEMORY, not persisted)
→ ContactEnquiryEmailSink.deliver(lead) → buildLeadEmail → Resend
→ client trade-desk inbox receives the full lead
→ success shown ONLY after Resend accepts (returns the public OEML reference)
```

### Sink selection (`lib/enquiries/email/sink.ts`)
`getContactEnquiryEmailSink()` mirrors the EnquirySink pattern:
- fully configured (`RESEND_API_KEY` + `ENQUIRY_EMAIL_FROM` + `ENQUIRY_EMAIL_TO`) →
  **`resendEnquiryEmailSink`** (real send, reusing `createResendTransport` +
  `sendWithTimeout` + `buildLeadEmail` — one email pipeline);
- unconfigured + **production** → **`unavailableEnquiryEmailSink`** (fail closed —
  returns a not_configured failure, a loud `enquiry.email.not_configured` log, and
  NEVER a fake success);
- unconfigured + **development/test** → **`logEnquiryEmailSink`** (records safe
  metadata, reports success, sends nothing).

### From / To / Reply-To (trust boundary)
- **From** = verified Resend sender from `ENQUIRY_EMAIL_FROM` (e.g.
  `OEML Enquiries <enquiries@client-domain.com>`) — keeps SPF/DKIM/DMARC valid.
- **To** = `ENQUIRY_EMAIL_TO` (the client trade-desk inbox).
- **Reply-To** = the submitter's validated email when
  `ENQUIRY_EMAIL_REPLY_TO_MODE=lead-email` (default), so the desk can press Reply. The
  submitter email is NEVER From or To.

### Email content
`buildLeadEmail` produces a subject that names the enquiry type
(`New OEML Supply Enquiry — Copper (cathode)`, `New OEML General Enquiry`) and a
plain-text + email-safe HTML body grouped into **ENQUIRY / CONTACT / REQUIREMENT**
sections, rendering only fields present, every lead value HTML-escaped, no remote
images/JS/tracking. No customer auto-reply is sent (internal notification only).

### Failure / success / idempotency
Resend errors are classified (`temporary` / `permanent` / `not_configured`) and never
surfaced raw; the user sees one generic "We couldn't send your enquiry right now.
Please try again." A bounded `sendWithTimeout` caps the request. The client hook holds
one `submissionToken` per form lifecycle (guards double-submit) and it is forwarded as
Resend's idempotency key, so an accidental resend is de-duplicated by the provider —
no DB idempotency. Success (and the OEML reference) is returned only after Resend
accepts. Logs are PII-free (reference, enquiryType, provider, providerMessageId,
failureClass — never name/email/phone/message/body/recipient/API key).

### Current limitation (accepted for this phase)
**There is no persistent lead database/CRM.** The client's mailbox is the sole lead
store. If a notification email is deleted or lost, the application retains no lead
history. This is a deliberate trade-off to ship without infrastructure.

### Future (behind the same seam, no form changes)
Add a `DatabaseLeadSink` (re-attaching the dormant §20–§23 outbox) and/or a
`FutureCRMSink` alongside `resendEnquiryEmailSink`; the Contact form and action do not
change. A durable store re-introduces retained lead history + the persist-first
success boundary if/when that is approved.

### Production setup in Resend (before launch)
1. Create/use the **client's** Resend account (client owns it — see §23 handover).
2. Verify the client's **sending domain** in Resend.
3. Add the DNS records Resend requests: **SPF**, **DKIM**, and a recommended **DMARC**
   policy (this repo makes no DNS changes).
4. Use a verified sender, e.g. `ENQUIRY_EMAIL_FROM="OEML Enquiries
   <enquiries@client-domain.com>"`.
5. Set the destination, e.g. `ENQUIRY_EMAIL_TO=sales@client-domain.com`.
6. Set `RESEND_API_KEY` securely on the production host (never committed; rotate any
   developer key at handover).
7. Host-agnostic — works on any Node/Next.js host (AWS, Vercel, Cloudflare, …).

### Safe local test
`npm run email:test` sends one clearly-labeled connectivity email via Resend using the
configured env (refuses production, recipient from `ENQUIRY_EMAIL_TO`/`EMAIL_TO`, never
prints the key). Configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and a
Resend-verified `EMAIL_FROM`/`EMAIL_TO` (or the `ENQUIRY_EMAIL_*` equivalents) first.
