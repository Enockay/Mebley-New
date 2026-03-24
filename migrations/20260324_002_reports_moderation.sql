-- Moderation reporting support for PostgreSQL migration

BEGIN;

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT reports_no_self_report CHECK (reporter_id <> reported_id),
  CONSTRAINT reports_unique_triplet UNIQUE (reporter_id, reported_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter
  ON reports (reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_reported
  ON reports (reported_id);

CREATE INDEX IF NOT EXISTS idx_reports_reason
  ON reports (reason);

COMMIT;
