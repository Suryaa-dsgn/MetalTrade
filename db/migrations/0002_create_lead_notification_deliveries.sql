-- Backend Phase 2E-1 — durable notification delivery outbox.
-- Applied by scripts/migrate.mjs (never at runtime / never from the request path).
--
-- One row per logical notification for a lead: identity = (lead_id, channel, purpose),
-- so a lead may carry several notifications on the same channel over its lifetime.
-- Phase 2E-1 creates the INTENT only (status 'pending'); attempt/claim/retry columns
-- (attempts, next_attempt_at, locked_*) are defined now but driven in 2E-2/2E-3.
-- NO PII is stored here — content is rebuilt at send time from the leads row.

CREATE TABLE IF NOT EXISTS lead_notification_deliveries (
  id                   UUID         PRIMARY KEY,
  lead_id              UUID         NOT NULL,
  channel              VARCHAR(16)  NOT NULL,
  purpose              VARCHAR(32)  NOT NULL,
  provider             VARCHAR(32)  NOT NULL,
  status               VARCHAR(16)  NOT NULL DEFAULT 'pending',
  attempts             INTEGER      NOT NULL DEFAULT 0,
  next_attempt_at      TIMESTAMPTZ  NOT NULL,
  last_attempt_at      TIMESTAMPTZ,
  last_error_class     VARCHAR(64),
  provider_message_id  VARCHAR(255),
  locked_at            TIMESTAMPTZ,
  locked_by            VARCHAR(64),
  created_at           TIMESTAMPTZ  NOT NULL,
  updated_at           TIMESTAMPTZ  NOT NULL,

  -- Delete the lead ⇒ its deliveries go too (aids erasure / retention).
  CONSTRAINT lead_notification_deliveries_lead_fk
    FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE,
  -- Delivery identity: lead + channel + purpose. NOT (lead_id, channel) — a lead may
  -- have several notifications on one channel (e.g. an internal alert now, a customer
  -- acknowledgement later). Named so the app can target it in ON CONFLICT.
  CONSTRAINT lead_notification_deliveries_identity_unique
    UNIQUE (lead_id, channel, purpose),
  -- The database defends the domain vocabulary, not only TypeScript.
  CONSTRAINT lead_notification_deliveries_status_check
    CHECK (status IN ('pending','processing','sent','failed')),
  CONSTRAINT lead_notification_deliveries_channel_check
    CHECK (channel IN ('email','crm','webhook')),
  -- Reserved purpose vocabulary. Only 'internal_lead_alert' is produced by the app in
  -- Phase 2E; the others are forward-compatible and NOT emitted yet.
  CONSTRAINT lead_notification_deliveries_purpose_check
    CHECK (purpose IN ('internal_lead_alert','customer_acknowledgement','assignment_alert'))
);

-- Indexes aligned to the two real scheduling paths (2E-3), plus per-lead lookup.
-- Kept minimal for this low-volume workload.
CREATE INDEX IF NOT EXISTS lead_notification_deliveries_due_idx
  ON lead_notification_deliveries (next_attempt_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS lead_notification_deliveries_lease_idx
  ON lead_notification_deliveries (locked_at) WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS lead_notification_deliveries_lead_idx
  ON lead_notification_deliveries (lead_id);
