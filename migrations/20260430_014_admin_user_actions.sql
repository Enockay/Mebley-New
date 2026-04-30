BEGIN;

-- Extend admin_actions action constraint to cover direct user management
ALTER TABLE admin_actions
  DROP CONSTRAINT IF EXISTS admin_actions_action_check;

ALTER TABLE admin_actions
  ADD CONSTRAINT admin_actions_action_check
  CHECK (action IN (
    'moderation_ban',
    'moderation_dismiss',
    'credits_admin_grant',
    'credits_admin_remove',
    'user_deactivate',
    'user_reactivate'
  ));

COMMIT;
