import 'server-only'

import { pgQuery } from '@/lib/postgres'

export async function insertUserNotification(input: {
  userId: string
  type: string
  title: string
  body?: string | null
  data?: Record<string, unknown>
  actorId?: string | null
}): Promise<void> {
  await pgQuery(
    `INSERT INTO user_notifications (user_id, type, title, body, data, actor_id)
     VALUES ($1, $2, $3, $4, COALESCE($5::jsonb, '{}'::jsonb), $6)`,
    [
      input.userId,
      input.type,
      input.title,
      input.body ?? null,
      JSON.stringify(input.data ?? {}),
      input.actorId ?? null,
    ]
  )
}
