-- Credit pack purchases via Paystack (and legacy Stripe fields). Used by paystack/initialise + paystack-fulfillment.

CREATE TABLE IF NOT EXISTS stripe_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  paystack_ref text,
  stripe_session_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  credits_purchased integer NOT NULL,
  bonus_credits integer NOT NULL DEFAULT 0,
  amount_usd numeric(12, 2) NOT NULL,
  stripe_payment_intent text,
  credit_pack_id uuid,
  pack_key text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_orders_paystack_ref ON stripe_orders (paystack_ref);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_stripe_session ON stripe_orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_user_status ON stripe_orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_completed ON stripe_orders (status, completed_at DESC)
  WHERE status = 'completed';
