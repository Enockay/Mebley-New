-- Ensure every profile has a credit wallet (catches users created after the initial seed)
INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
SELECT id, 0, 0, 0
FROM profiles
WHERE id NOT IN (SELECT user_id FROM credit_wallets);
