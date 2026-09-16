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

## 18. Implementation phases

- **2A** (this phase): domain types, reference generation, normalization, minimal
  atomic `LeadRepository` + in-memory impl + factory, `LeadSubmissionService`,
  `NotificationProvider` seam + log provider, integration into `submitContactEnquiry`.
  In-memory only; no external deps.
- **2B:** client `submissionToken` (the one form change) + reference/idempotency
  end-to-end + observability polish.
- **2C:** `LeadNotificationService` email adapter behind the neutral seam (disabled by
  default; provider chosen with hosting/domain/inbox).
- **2D:** durable Postgres `LeadRepository` (unique constraints, least-privilege
  creds). Gated on platform/DB approval.
- **2E:** notification retry (bounded sync + durable `pending` re-attempt); outbox/queue
  only if warranted.
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
