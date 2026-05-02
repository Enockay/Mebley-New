-- Fixes from production logs: subscriptions / Paystack touch profiles.plan_expires;
-- admin verification inserts verification_* actions; call_history updates need typed params.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_expires timestamptz;

ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_action_check;

ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_action_check CHECK (
  action IN (
    'moderation_ban',
    'moderation_dismiss',
    'credits_admin_grant',
    'credits_admin_remove',
    'user_deactivate',
    'user_reactivate',
    'verification_approved',
    'verification_rejected'
  )
);
