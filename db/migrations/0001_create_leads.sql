-- Backend Phase 2C — durable leads table.
-- Applied by scripts/migrate.mjs (never at runtime / never from the request path).

CREATE TABLE IF NOT EXISTS leads (
  id                UUID         PRIMARY KEY,
  reference         VARCHAR(32)  NOT NULL,
  submission_token  VARCHAR(64)  NOT NULL,
  created_at        TIMESTAMPTZ  NOT NULL,
  updated_at        TIMESTAMPTZ  NOT NULL,
  status            VARCHAR(16)  NOT NULL DEFAULT 'new',
  enquiry_type      VARCHAR(16)  NOT NULL,
  contact_name      VARCHAR(120) NOT NULL,
  contact_email     VARCHAR(254) NOT NULL,
  contact_phone     VARCHAR(40),
  company           VARCHAR(160),
  country           VARCHAR(80)  NOT NULL,
  commodity         VARCHAR(80),
  quantity          VARCHAR(60),
  origin            VARCHAR(160),
  destination       VARCHAR(160),
  message           VARCHAR(4000) NOT NULL,
  source            VARCHAR(32)  NOT NULL,

  -- Named constraints so the app can distinguish which unique index was violated.
  CONSTRAINT leads_reference_unique        UNIQUE (reference),
  CONSTRAINT leads_submission_token_unique UNIQUE (submission_token),
  -- The database defends the domain invariants, not only TypeScript.
  CONSTRAINT leads_status_check CHECK (status IN ('new','contacted','qualified','closed')),
  CONSTRAINT leads_enquiry_type_check CHECK (
    enquiry_type IN ('buy','supply','logistics','general','partnership')
  )
);
