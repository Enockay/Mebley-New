-- ─── Credit wallets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_wallets (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance          integer     NOT NULL DEFAULT 0,
  lifetime_earned  integer     NOT NULL DEFAULT 0,
  lifetime_spent   integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_wallets_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS credit_wallets_user_id_idx ON credit_wallets(user_id);

-- ─── Credit transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount         integer     NOT NULL,         -- positive = credit, negative = debit
  balance_after  integer     NOT NULL,
  type           text        NOT NULL,         -- e.g. 'purchase', 'moment_spend', 'boost_purchase'
  reference_type text,
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON credit_transactions(user_id);

-- ─── Moments ─────────────────────────────────────────────────────────────────
-- Stores user-purchased presence/social moments (here_tonight, spotlight, etc.)
CREATE TABLE IF NOT EXISTS moments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type           text        NOT NULL,   -- 'here_tonight' | 'night_out' | 'spotlight' | etc.
  status         text        NOT NULL DEFAULT 'pending',  -- 'pending' | 'seen' | 'expired'
  credits_spent  integer     NOT NULL DEFAULT 0,
  expires_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moments_sender_id_idx  ON moments(sender_id);
CREATE INDEX IF NOT EXISTS moments_receiver_id_idx ON moments(receiver_id);
CREATE INDEX IF NOT EXISTS moments_type_expires_idx ON moments(type, expires_at);

-- ─── Boosts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boosts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  boost_type     text        NOT NULL,   -- 'quick' | 'day' | 'weekend' | 'power'
  duration_hours integer     NOT NULL,
  credits_spent  integer     NOT NULL DEFAULT 0,
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS boosts_user_id_idx    ON boosts(user_id);
CREATE INDEX IF NOT EXISTS boosts_expires_at_idx ON boosts(expires_at);

-- ─── Seed wallets for existing users who don't have one ─────────────────────
INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
SELECT id, 200, 200, 0
FROM profiles
WHERE id NOT IN (SELECT user_id FROM credit_wallets);
