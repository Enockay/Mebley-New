import 'server-only'

import { pgQuery } from '@/lib/postgres'
import { WHO_LIKED_YOU_UNLOCK_REF } from '@/lib/who-liked-you-unlock.constants'

export async function hasWhoLikedYouCreditUnlock(userId: string): Promise<boolean> {
  const res = await pgQuery<{ id: string }>(
    `SELECT id FROM credit_transactions
     WHERE user_id = $1 AND reference_type = $2
       AND created_at > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [userId, WHO_LIKED_YOU_UNLOCK_REF]
  )
  return !!res.rows[0]
}
