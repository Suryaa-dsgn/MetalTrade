# OEML Phase 2E Durable Notification Delivery Design

Design only. No implementation code. This document specifies how notification
delivery for a persisted lead becomes durable, crash-safe, multi-instance-safe, and
free of duplicate sends, while preserving every existing guarantee. It is the plan
Phase 2E will implement after approval.

## 0. Guiding invariants (unchanged)

- **PostgreSQL remains the system of record.** Nothing here changes that.
- **Lead submission success depends ONLY on durable lead persistence** (`createOrGet`
  returns). Notification is downstream and never gates success.
- **A notification failure never invalidates an accepted lead.**
- **Notification state never returns to the `Lead` entity.** It lives in a separate
  table, as `NotificationDelivery` already models conceptually (§3 of the lead-backend
  doc).
- No fake in-process queue, no detached promises, no Redis/SQS/worker unless the
  design shows a real need (it does not, yet — see §15).
- No Contact UI change; frontend/backend separation unchanged.

## 1. Persistent NotificationDelivery — the core idea (transactional outbox)

Phase 2D delivers immediately and best-effort; a crash between lead persistence and
send can lose the notification. Phase 2E closes that with the **transactional outbox
pattern**:

```
BEGIN                                   ← single Postgres transaction
  create-or-get lead
  create delivery intent (status='pending')  ← only for a NEWLY created lead
COMMIT   (either both writes land, or ROLLBACK — never one without the other)
      │
      ▼  (optionally, best-effort, synchronous, bounded — the "fast path", 2E-2)
first attempt now
      │
      ├─ sent               → status='sent'
      ├─ temporary/timeout   → status='pending', nextAttemptAt = now + backoff
      └─ permanent           → status='failed'
      │
      ▼  (scheduled drain — the "slow path", any instance, 2E-3)
claim due pending rows (FOR UPDATE SKIP LOCKED) → attempt → same transitions
```

Because the intent row is committed **in the SAME transaction as the lead** (never
"lead commit, then intent insert"), the delivery is never lost and never orphaned: if
the process dies before or during the first attempt the row is already `pending`, and
if the intent write fails the lead insert rolls back with it. This is the correct,
boring, database-native solution — it needs no external broker.

## 2. Dedicated table now? — Yes

Add a dedicated table **`lead_notification_deliveries`** now. Reasons:

- The domain already separates `Lead` from `NotificationDelivery`; this makes that
  persistent. One lead can have many deliveries (email now, CRM/webhook later) —
  a one-to-many that must not be crammed into `leads`.
- A dedicated table gives the columns retry/claiming need (`status`, `attempts`,
  `next_attempt_at`, lease fields) without polluting the lead row.
- It keeps **all PII in `leads`** and **zero PII in the delivery table** (§21).

Do **not** build a generic outbox table for arbitrary event types yet; a purpose-built
delivery table is simpler to reason about and index. Generalize only if a second
unrelated outbox need appears.

## 3. Exact fields

Table `lead_notification_deliveries` (naming/types follow `0001_create_leads.sql`):

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | opaque delivery id (also the provider idempotency-key seed, §10/§19) |
| `lead_id` | `UUID NOT NULL` | FK → `leads(id)` `ON DELETE CASCADE` (delete lead ⇒ its deliveries go too, aids erasure/retention) |
| `channel` | `VARCHAR(16) NOT NULL` | `email` now; `crm`/`webhook` later. CHECK against the known set |
| `purpose` | `VARCHAR(32) NOT NULL` | the logical notification, so a lead can have several notifications on the SAME channel over time. `internal_lead_alert` only in 2E; future: `customer_acknowledgement`, `assignment_alert` (NOT built now) |
| `provider` | `VARCHAR(32) NOT NULL` | resolved provider name (`ses`/`resend`/…) at intent time; `none` never creates a row |
| `status` | `VARCHAR(16) NOT NULL DEFAULT 'pending'` | `pending`/`processing`/`sent`/`failed` (CHECK) |
| `attempts` | `INTEGER NOT NULL DEFAULT 0` | incremented at the START of each attempt |
| `next_attempt_at` | `TIMESTAMPTZ NOT NULL` | when the row becomes due; set to `created_at` for the first attempt |
| `last_attempt_at` | `TIMESTAMPTZ` | null until the first attempt starts |
| `last_error_class` | `VARCHAR(64)` | failure classification only — never an error message, never PII |
| `provider_message_id` | `VARCHAR(255)` | provider-returned id on `sent` (§19); nullable |
| `locked_at` | `TIMESTAMPTZ` | lease start for a claim (§11/§12); null when not `processing` |
| `locked_by` | `VARCHAR(64)` | opaque worker/instance token for the current lease (diagnostics) |
| `created_at` | `TIMESTAMPTZ NOT NULL` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL` | bumped on every transition |

`locked_at`/`locked_by` are the only additions beyond the requested list; they are
required for safe claiming + crash recovery (§9/§11/§12). If a stricter minimal schema
is preferred, the lease can be folded into `status='processing' + last_attempt_at`,
but an explicit `locked_at` makes lease expiry unambiguous and is recommended.

**Indexes** — aligned with the two real scheduling paths, and nothing more (low
volume):
- due pending work: `(next_attempt_at) WHERE status = 'pending'`
- expired processing leases: `(locked_at) WHERE status = 'processing'`
- per-lead lookup: `(lead_id)`

Do not over-index beyond this.

## 4. Unique constraints (no duplicate delivery records)

Delivery identity is **lead + channel + purpose**, so:

**`UNIQUE (lead_id, channel, purpose)`** — one logical notification per lead per
channel per purpose. NOT `UNIQUE(lead_id, channel)`: a lead may legitimately have
several notifications on the same channel over its lifetime (e.g. the internal alert
now, a customer acknowledgement and an assignment alert later), each a distinct
`purpose`. This is the linchpin against duplicates:

- Intent creation uses `INSERT … ON CONFLICT (lead_id, channel, purpose) DO NOTHING`,
  so a retried lead submission (idempotent `createOrGet`) never creates a second
  `internal_lead_alert` intent for the same lead. This mirrors the lead idempotency
  already in place.
- It expresses the rule directly: "this lead gets at most one delivery per (channel,
  purpose)," so at most one row can ever drive a given send.
- The schema already ADMITS a future second purpose on the same channel (e.g.
  `customer_acknowledgement` on `email`) with no migration change — only
  `internal_lead_alert` is created in 2E.

(Per-attempt history, if wanted later, goes in a separate `*_attempts` child table —
out of scope for 2E; the single row + `attempts` counter is sufficient now.)

## 5. State model

```
        (intent persisted)
             pending ──────────────► processing ──────► sent   (terminal)
                ▲                        │
                │  temporary/timeout     ├──────────────► failed (terminal: permanent, OR attempts exhausted)
                └────────────────────────┘
                     (next_attempt_at = now + backoff)
```

- **pending** — intent committed, due at `next_attempt_at`, not currently held.
- **processing** — a claimer holds a lease (`locked_at`/`locked_by` set) and is
  attempting a send. A crashed processing row whose lease expired is reclaimable.
- **sent** — provider accepted; `provider_message_id` stored. Terminal.
- **failed** — permanent provider failure, OR max attempts exhausted. Terminal;
  surfaced for operator attention. Not auto-retried (a human/Phase 2F may requeue).

`processing` is deliberately a real state (not implied) so concurrent claimers can
skip it and crash recovery can find it.

## 6. Retryability rules

Reuse the Phase 2D typed outcomes; classification lives at the adapter boundary:

- **sent** → terminal success.
- **temporary_failure** (provider 5xx) → retryable.
- **network failure** → retryable **only when the transport can classify it as having
  occurred BEFORE request transmission** (e.g. connection refused/DNS) — no send could
  have happened, so a retry is safe regardless of `idempotentSend`. An unclassifiable
  network error is treated as ambiguous (below).
- **timeout / ambiguous outcome** (the request may or may not have been delivered) —
  branches on the transport capability:
  - `idempotentSend = true` → **eligible for automatic retry** with the same stable
    delivery idempotency key (delivery `id`, §10); the provider suppresses the
    duplicate.
  - `idempotentSend = false` → **do NOT blindly retry.** Persist an ambiguous/failure
    classification (`last_error_class` e.g. `ambiguous_timeout`) and route to
    `failed` for **operator recovery** rather than risking a duplicate email.
- **permanent_failure** (rejected address, 4xx, policy) → NOT retryable → `failed`.
- **not_configured / misconfigured** → NOT a delivery outcome and **NOT counted as an
  attempt** (§6a). Surface loudly (§20); the intent stays `pending` for when config is
  fixed.

### 6a. Disabled vs misconfigured vs attemptable

Distinguish three provider states, and never conflate them (extends Phase 2D):

- **`EMAIL_PROVIDER=none` (disabled):** the business does not want an email → **create
  NO intent row** (§5 of the canonical doc; nothing to deliver, nothing to drain).
- **A real provider selected but temporarily unusable / misconfigured** (adapter
  missing, credentials absent, config invalid): the business DID intend the email →
  the intent row already exists and is **preserved as `pending`** — never silently
  discarded. A configuration problem is **not a delivery attempt**: the claimer must
  not pick these rows up (§12), so `attempts` is not consumed and backoff is not
  advanced. When the configuration is fixed, the durable drain processes the existing
  intent normally. This surfaces as `lead.notification.email.misconfigured` (loud),
  not as `lead.notification.failed`.

## 7. Maximum attempts

**`MAX_ATTEMPTS = 6`** (roughly a day of retries under the backoff below). On reaching
it the row goes `failed` with `last_error_class` preserved. The cap is a single
constant, easy to tune. A `failed` row is never silently retried.

## 8. Backoff strategy

**Exponential backoff with full jitter, capped.** Base 1 min, factor 2, cap 1 hour:

```
delay(attempt) = min(CAP, BASE * 2^(attempt-1)) with full jitter
attempt 1→2: ~1m   2→3: ~2m   3→4: ~4m   4→5: ~8m   5→6: ~16m   (cap 60m)
```

`next_attempt_at = now + delay`. Jitter prevents thundering-herd re-attempts across
instances after a provider outage recovers. The math lives in a pure, unit-tested
helper (mirrors `lib/market/providers/retry.ts` style).

## 9. Crash recovery

Two crash windows, both covered:

- **Crash before/at the first attempt:** the intent row is already committed
  (`pending`) in the lead transaction, so the drain finds it. No loss.
- **Crash mid-attempt (`processing`):** the claim set `locked_at`. A row is
  **reclaimable** when `status='processing' AND locked_at < now() - LEASE` (lease e.g.
  2× the provider timeout, say 60s). The drain treats an expired-lease `processing`
  row exactly like a due `pending` row (re-claims it). Because the send carries a
  provider idempotency key (§10), a reclaim after a send that actually succeeded does
  not double-send.

No startup "reset stuck rows" job is needed — lease expiry handles it lazily and
safely across instances.

## 10. Idempotency of notification delivery

Three layers:

1. **Intent idempotency:** `UNIQUE(lead_id, channel)` + `ON CONFLICT DO NOTHING` ⇒ one
   intent per lead/channel regardless of submission retries.
2. **Claim idempotency:** only one instance can move a row `pending→processing` (§12),
   so only one instance sends per attempt.
3. **Provider idempotency — capability-based, never assumed.** Duplicate suppression
   after an ambiguous timeout depends on the concrete provider, so it is a declared
   capability, not a blanket assumption. The `EmailTransport` seam gains:

   ```
   capabilities: { idempotentSend: boolean }
   send(message, { signal?, idempotencyKey? })   // key = delivery id (stable, not per-attempt)
   ```

   A Resend-style transport that enforces idempotency on a client-supplied key sets
   `idempotentSend: true`. **AWS SES `SendEmail` is NOT assumed idempotent** unless the
   exact API in use explicitly guarantees it (it does not for plain `SendEmail`); such
   a transport declares `idempotentSend: false`. The key is a structured field, never a
   hand-built header. This keeps the policy provider-neutral — see the retry rules in
   §6, which branch on this capability.

## 11. Avoiding two instances sending the same notification

The row is the lock. `pending→processing` is a single atomic UPDATE guarded by
`FOR UPDATE SKIP LOCKED` (§12), so exactly one instance wins the claim; others skip
that row and move on. The lease (`locked_at`) plus provider idempotency key (§10)
handle the residual crash/timeout races. No external coordinator is required.

## 12. Row-claiming strategy in Postgres

Atomic claim-and-mark in one statement:

```sql
UPDATE lead_notification_deliveries d
SET status = 'processing',
    locked_at = now(),
    locked_by = $1,          -- opaque instance token
    attempts = attempts + 1,
    last_attempt_at = now(),
    updated_at = now()
WHERE d.id IN (
  SELECT id FROM lead_notification_deliveries
  WHERE (status = 'pending'    AND next_attempt_at <= now())
     OR (status = 'processing' AND locked_at < now() - $2::interval)  -- expired lease
  ORDER BY next_attempt_at
  FOR UPDATE SKIP LOCKED
  LIMIT $3                    -- small batch (e.g. 10)
)
RETURNING d.*;
```

The claimer then attempts each returned row and writes the terminal/next state. The
`attempts++` at claim time means a crash-after-claim still counts the attempt (fails
safe toward the cap rather than looping forever).

**Claim ONLY sendable deliveries.** Because the claim increments `attempts`, the drain
must not claim rows whose provider is currently unavailable/misconfigured — otherwise a
configuration problem would burn through the attempt budget and `fail` a delivery the
business still wants. The dispatcher determines "sendable now" from the same
resolution as Phase 2D (a supported, configured, `isConfigured()` transport for the
row's channel/provider). Unsendable rows are left untouched as `pending` (not claimed,
not attempted) and the misconfiguration is surfaced loudly. `attempts` therefore always
counts REAL delivery attempts. Implementation options: gate in the dispatcher before
attempting, and/or add `AND provider = ANY($sendableProviders)` to the claim's inner
select so unsendable rows are never locked.

## 13. Is `FOR UPDATE SKIP LOCKED` appropriate? — Yes

It is the standard, correct primitive for a Postgres-as-queue drain: concurrent
drainers each grab disjoint batches without blocking each other, and a row locked by
one drainer is skipped by others (no double-processing, no lock contention). It is
exactly what multi-instance safety here requires, and it is why an external queue is
unnecessary at this scale (§15).

## 14. Is a scheduled re-attempt sufficient initially? — Yes

For OEML's low lead volume, a **scheduled drain** (e.g. every 1–2 minutes) invoking the
claim-and-send batch is sufficient and simple. Delivery approach:

- The scheduler is a **platform scheduled task / cron** (e.g. the host's scheduled
  function, or a small protected internal route hit by an external scheduler). The
  choice is deferred to the hosting decision; the drain logic is host-agnostic and
  callable from any of them.
- Combined with the **synchronous first attempt** (§16), the common case sends within
  seconds and the scheduler only handles retries and crash recovery — so a 1–2 min
  cadence is invisible to normal operation.

No always-on worker process is needed. (If the platform offers only long cron
intervals, the sync first attempt still covers the happy path.)

## 15. When a real queue (SQS/etc.) becomes justified

Move off Postgres-as-queue only when a concrete signal appears, not speculatively:

- Sustained delivery throughput that makes the drain query hot / contended.
- Many channels each needing independent, high-rate, fan-out dispatch.
- A need for cross-service delivery, dead-letter tooling, or delivery decoupled from
  this app's deploys/scaling.
- Strict latency SLAs requiring always-on consumers rather than a periodic drain.

Until then, `FOR UPDATE SKIP LOCKED` on a small table is simpler, cheaper, and needs no
new infrastructure. The `NotificationProvider`/`EmailTransport` seam and the delivery
table mean a later swap to SQS is a dispatch-layer change, not a domain change.

## 16. Sync first attempt + durable retry vs fully async from day one

**Recommended: durable intent first, then an OPTIONAL bounded synchronous first
attempt, then return the already-determined result.** The precise ordering for
2E-2 is:

```
persist lead + intent (atomic, §1)      ← success/failure is DECIDED here
→ [optional] one bounded synchronous delivery attempt
→ return the already-determined submission result
```

- The submission result is fixed the moment persistence commits. The synchronous
  attempt runs **after** that decision and **before** the response is returned — so it
  is wrong to say "the response has already returned"; the request is still open and
  its **latency may be extended** by the bounded attempt. What is guaranteed is that
  the attempt's outcome can **never change** success→failure or failure→success after
  persistence.
- **No detached promise:** the attempt is awaited inline; its result is persisted to
  the delivery row; a failure simply leaves the row `pending` for the drain. There is
  no fire-and-forget background work.
- The attempt is **bounded** (Phase 2D timeout) so it cannot hang the request
  indefinitely, and it is **best-effort**: any failure/timeout is swallowed into the
  row state, never propagated to the user.
- Pros vs fully-async-from-day-one: the desk usually gets the email in seconds without
  waiting for a scheduler tick, while the durable row still guarantees eventual
  delivery.
- **Reassess after 2E-3:** once the durable scheduled drain exists, we will revisit
  whether the synchronous fast path is still worth its added request latency, or
  whether to drop it in favor of drain-only delivery. That decision is deferred to
  2E-3, not made now.

Note: 2E-1 does NOT add the synchronous attempt logic — it only persists the intent;
the existing Phase 2D best-effort first-attempt path remains until 2E-2.

## 17. Provider timeout / cancellation semantics

- Each attempt keeps the Phase 2D **bounded timeout** (AbortController + timer). On
  timeout the attempt returns `temporary_failure(code=timeout)` and the row becomes
  `pending` with backoff.
- **`Promise.race` is not cancellation** (documented in 2D): the underlying request may
  still complete. The `EmailTransport.send(message, { signal, idempotencyKey })` seam
  lets a real SDK cancel cooperatively where supported. Whether a timed-out-but-
  delivered send is safely retryable depends on `capabilities.idempotentSend` (§6/§10):
  idempotent transports retry with the stable key; non-idempotent transports route the
  ambiguous outcome to operator recovery instead of retrying.
- The lease (§9) must be **longer than** the per-attempt timeout so a slow send is not
  reclaimed mid-flight.

## 18. Provider outcome → action

| Provider returns | Row transition | Attempt counts? | Duplicate-safe? |
|---|---|---|---|
| **sent** | `sent`, store `provider_message_id` | yes | terminal |
| **temporary failure** (5xx) | `pending`, `next_attempt_at = now+backoff`; `failed` if attempts ≥ MAX | yes | retry safe (no send happened / idempotent) |
| **network, pre-transmission** | `pending` + backoff | yes | retry safe (no send occurred) |
| **permanent failure** | `failed`, keep `last_error_class` | yes | terminal, no retry |
| **timeout / ambiguous, `idempotentSend=true`** | `pending` + backoff (retry w/ same key), or `failed` if exhausted | yes | provider suppresses duplicate |
| **timeout / ambiguous, `idempotentSend=false`** | `failed` (`ambiguous_timeout`) for operator recovery — NOT auto-retried | yes | not retried → no duplicate risk |
| **not_configured / misconfigured** | stays `pending`, NOT claimed | **no** (not a delivery attempt) | n/a |

## 19. Provider message / request id storage

On `sent`, store the provider's id in `provider_message_id` (nullable; not all
providers return one). It is operational metadata (support/trace correlation), not
PII, and is safe to log. It is also the anchor for a future delivery-status webhook
(bounce/complaint) in Phase 2F — designed for, not built now.

## 20. Observability events (PII-free)

Extend the Phase 2D event set; all carry `correlationId` (where available), opaque
`leadId`, opaque `deliveryId`, `channel`, `provider`, `attempt`, `status`,
`failureClass`, `nextAttemptAt` — never PII, never message bodies, never addresses:

- `lead.notification.intent.persisted`
- `lead.notification.claimed` (drain claim; include batch size)
- `lead.notification.started` (exists)
- `lead.notification.sent` (exists; add `providerMessageId`)
- `lead.notification.failed` (exists; add `retryable`, `nextAttemptAt`)
- `lead.notification.retry.scheduled`
- `lead.notification.exhausted` (hit MAX_ATTEMPTS → `failed`)
- `lead.notification.reclaimed` (expired-lease recovery)
- `lead.notification.email.misconfigured` (exists; unchanged)

## 21. PII handling

The delivery table stores **no PII** — only `lead_id` (FK), channel, provider, status,
counters, timestamps, `last_error_class`, `provider_message_id`, lease fields. Email
content is **rebuilt at send time** from the `leads` row (the sole PII home), so PII is
never duplicated into the delivery/outbox layer. Logs stay PII-free (§20). This keeps
erasure simple: deleting/anonymizing the lead (CASCADE) removes its deliveries too.

## 22. Retention of notification delivery records

- Because the delivery row holds no PII, retention is an **operational** concern, not a
  privacy one. Keep terminal rows (`sent`/`failed`) for an operational window
  (**default 90 days**, tunable) for audit/troubleshooting, then prune.
- Pruning is a separate scheduled maintenance step (or `ON DELETE CASCADE` when the
  parent lead is erased under the lead retention policy). No indefinite growth.
- Exact durations follow the same client/legal confirmation the lead retention
  placeholder awaits; the mechanism is designed, the number is a config constant.

## 23. Failure matrix

| Scenario | User sees | Lead exists? | Delivery row | Retry |
|---|---|---|---|---|
| Persist fails | generic try-again | No | none (same tx) | n/a |
| Persist ok, intent insert conflict (dup lead) | success | Yes (original) | existing row, untouched | n/a (idempotent) |
| Sync first attempt sent | success | Yes | `sent` | none |
| Sync attempt temporary/timeout | success | Yes | `pending`+backoff | drain |
| Sync attempt permanent | success | Yes | `failed` | none |
| Crash after commit, before send | success | Yes | `pending` | drain picks up |
| Crash mid-send (`processing`) | success | Yes | `processing`, lease expires | reclaimed by drain |
| Two instances, same row | success | Yes | one claims (`processing`), other skips | single send |
| Provider down for hours | success | Yes | retries w/ backoff, then `failed` at MAX | drain until cap |
| Email disabled (`none`) | success | Yes | **no intent row created** | n/a |
| Email misconfigured (`ses` no adapter) | success | Yes | intent row NOT sendable; loud misconfig event; row stays `pending` (or skipped) | not counted as attempts |

## 24. Migration plan

- Add **`db/migrations/0002_create_lead_notification_deliveries.sql`** (+ a
  `0002_*.down.sql` for deliberate rollback), applied by the existing
  `scripts/migrate.mjs` (`npm run db:migrate`), tracked in `schema_migrations`, in a
  transaction, **never at runtime / never on the request path** — identical workflow
  to `0001`.
- Table + CHECKs + `UNIQUE(lead_id, channel)` + FK to `leads(id) ON DELETE CASCADE` +
  the partial drain index.
- Forward-compatible: a future `*_attempts` child table or webhook-status columns are
  additive migrations; nothing here blocks them.
- Deploy ordering: apply `0002` before enabling the drain; the sync-attempt path
  tolerates an already-present table with no data.

## 25. Test strategy (incl. concurrency)

All via the existing PGlite in-process executor (no external DB, no network); provider
via the fake transport (Phase 2D). Coverage:

- **Migration/schema:** constraints + CHECKs + unique + partial index behavior.
- **Intent idempotency:** repeated submission → one delivery row (`ON CONFLICT`).
- **State transitions:** pending→processing→sent / →failed; backoff sets
  `next_attempt_at`; attempts increment; MAX_ATTEMPTS → `failed` (`exhausted`).
- **Backoff helper:** pure unit tests (bounds, monotonic-with-jitter, cap).
- **Claiming / concurrency:** two drainers over N due rows via
  `FOR UPDATE SKIP LOCKED` → disjoint claims, each row sent **exactly once**, no double
  send (assert on fake-transport `sent` count). PGlite supports SKIP LOCKED; if a given
  PGlite build limits true concurrency, add a serialized-interleave test plus a
  documented note, and keep the SQL exercised.
- **Crash recovery:** a `processing` row with an expired lease is reclaimed and sent
  once; a non-expired lease is skipped.
- **Idempotency key:** timeout-then-retry passes the SAME key (delivery id) both
  times (assert on the fake transport).
- **Outcome mapping:** sent/temporary/permanent/timeout → correct row + events.
- **PII:** delivery rows + all emitted logs contain no name/email/phone/message/body.
- **Success boundary preserved:** lead success returned even when every attempt fails;
  existing 260 tests stay green.

## 26. Exact modules / files to add / change

Legend: **[2E-1]** now, [2E-2]/[2E-3]/[2E-4] later.

**Add**
- **[2E-1]** `db/migrations/0002_create_lead_notification_deliveries.sql` (+ `.down.sql`)
- **[2E-1]** `lib/leads/notification/delivery/types.ts` — persistent `NotificationDelivery`
  shape + status/purpose/channel types (the operational `NotificationDelivery` concept
  moves here from `lib/leads/types.ts`; re-export to avoid churn)
- **[2E-1]** `lib/leads/notification/delivery/repository.ts` — port. 2E-1 needs only
  `createIntent(delivery, exec?)` (ON CONFLICT DO NOTHING). `claimDue`/`markSent`/
  `markRetry`/`markFailed` are DECLARED for later sub-phases but implemented in 2E-2/3.
- **[2E-1]** `lib/leads/notification/delivery/repository.pg.ts` — Postgres impl over the
  existing `SqlExecutor` (transaction-aware — accepts an injected executor)
- **[2E-1]** `lib/leads/notification/delivery/repository.memory.ts` — in-memory impl that
  models the SAME atomic + unique semantics for unit tests / local
- **[2E-1]** `lib/leads/notification/delivery/mapping.ts` — pure row ↔ NotificationDelivery
- [2E-2] `lib/leads/notification/delivery/backoff.ts` — pure backoff + retryability
- [2E-3] `lib/leads/notification/delivery/dispatcher.ts` — claim → build → send →
  persist outcome; the drain entry point (claim-only-sendable, §12)
- [2E-3] `app/api/internal/notifications/drain/route.ts` (or equivalent) — protected
  endpoint the scheduler calls; thin wrapper over the dispatcher (auth/allowlist; no PII)
- tests alongside each (`*.test.ts`)

**Change (minimal, additive)**
- **[2E-1]** `lib/leads/db/executor.ts` — extend the port with a
  `transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T>` method (Unit of
  Work). The callback receives a transaction-scoped `SqlExecutor`; the impl runs
  `BEGIN`/`COMMIT`, and `ROLLBACK` on throw. Still parameterized-only, still no
  `server-only`, still driver-agnostic.
- **[2E-1]** `lib/leads/db/pg-executor.ts` — implement `transaction()` on a pooled
  client (`pg` `BEGIN`/`COMMIT`/`ROLLBACK`, one client per tx). Tests supply a
  PGlite-backed executor whose `transaction()` has the same semantics.
- **[2E-1]** `lib/leads/repository/postgres.ts` — `createOrGet` accepts an optional
  injected executor so it can run inside a caller's transaction (default: the shared
  pool, unchanged behavior).
- **[2E-1]** `lib/leads/service.ts` — orchestrate the atomic unit of work: within one
  `executor.transaction(tx => …)`, `createOrGet(lead, tx)` then, for a newly created
  lead with email intended (provider != none), `deliveryRepo.createIntent(intent, tx)`.
  Submission success is still the committed persistence. The service holds NO raw SQL —
  it composes transaction-scoped repositories. The existing Phase 2D best-effort
  first-attempt (log/email provider) path is unchanged in 2E-1.
- [2E-2] `lib/leads/notification/email/types.ts` — add `capabilities.idempotentSend`
  and `EmailSendOptions.idempotencyKey?` (structured field); transports declare the
  capability.
- [2E-2/3] `lib/config/env.ts` — MAX_ATTEMPTS / batch / lease constants only if they
  must be env-tunable; otherwise module constants.
- **[2E-1]** `.env.example`, `docs/lead-backend-architecture.md` — document 2E-1.

No Contact UI files. No CRM/admin/queue infra files.

## 27. Implementation phases inside 2E

- **2E-1 — schema + atomic intent (outbox):** migration `0002`; persistent
  `NotificationDelivery` types; delivery repository port + Postgres impl + memory impl
  + mapping; the `SqlExecutor.transaction` Unit of Work; the atomic
  lead + delivery-intent transaction in the service; intent idempotency
  (`ON CONFLICT DO NOTHING` on `(lead_id, channel, purpose)`); `internal_lead_alert`
  only; relevant observability. **NO** retry/backoff, claiming, scheduler/drain,
  provider SDK, real-send changes, retention, CRM, admin, queue. The existing Phase 2D
  first-attempt path stays as-is. Proves durability + atomicity + idempotency.
- **2E-2 (done):** the persisted `pending` intent drives one bounded first attempt
  whose outcome is written back — explicit `markSent`/`markRetry`/`markFailed`
  transitions (attempts counted only for real sends), pure backoff (`next_attempt_at`
  as data), capability-based ambiguity handling with the delivery id as the provider
  idempotency key, and email moved off the ephemeral seam onto the durable outbox.
  No scheduler/claiming/retry-loop.
- **2E-3 — scheduled drain + claiming:** `claimDue` with `FOR UPDATE SKIP LOCKED` +
  lease/crash recovery; the protected drain endpoint; concurrency + recovery tests;
  wire the platform scheduler (host-dependent, minimal).
- **2E-4 — observability + retention + hardening:** full event set, `exhausted`/
  `reclaimed`, retention prune step, failure-matrix tests, docs.

Each sub-phase is independently shippable, validated (tsc/lint/test/build/audit), and
gated for review — same protocol as 2A–2D.

## 28. Intentionally deferred (NOT in 2E)

- CRM delivery channel and admin/query/read interfaces (Phase 2F).
- Customer acknowledgement emails (consent/copy/deliverability — separate decision).
- Delivery-status webhooks (bounce/complaint handling) — the `provider_message_id`
  anchor is designed for it, not built.
- Real SQS/Redis/worker infrastructure (only if §15 signals appear).
- A generic multi-type outbox / event bus.
- Per-attempt history child table (the single row + counter suffices now).
- Choosing the concrete email vendor/SDK (still Phase 2D's open item) — 2E works with
  the fake transport in tests and remains disabled/fail-loud until a vendor is
  approved.

---

**Status:** design only. No code written. Awaiting approval to implement 2E-1.
