-- Paystack subscription billing (primary Postgres). Required by /api/paystack/* and paystack-fulfillment.

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  tier text NOT NULL,
  billing_period text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paystack_ref text UNIQUE,
  paystack_sub_code text,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  weekly_credits_allocated integer NOT NULL DEFAULT 0,
  weekly_credits_last_reset timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period_end ON subscriptions (status, current_period_end);
