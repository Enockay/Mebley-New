BEGIN;

-- Moderation workflow: queue + admin decisions
CREATE TABLE IF NOT EXISTS moderation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT moderation_cases_status_check CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  CONSTRAINT moderation_cases_report_id_key UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS idx_moderation_cases_status_created
  ON moderation_cases(status, created_at DESC);

-- Payment fulfillment idempotency lock ledger
CREATE TABLE IF NOT EXISTS paystack_fulfillments (
  reference text PRIMARY KEY,
  status text NOT NULL DEFAULT 'processing',
  fulfillment_type text,
  last_error text,
  attempts integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_paystack_fulfillments_status_updated
  ON paystack_fulfillments(status, updated_at DESC);

-- Cross-store consistency issue tracker for follow-up jobs
CREATE TABLE IF NOT EXISTS consistency_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  source text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  details jsonb,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT consistency_issues_severity_check CHECK (severity IN ('warning', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_consistency_issues_open
  ON consistency_issues(resolved, created_at DESC);

COMMIT;
