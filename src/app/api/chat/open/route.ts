import { NextRequest, NextResponse } from 'next/server'
import { withPgClient } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const targetUserId = body?.targetUserId
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
    }
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot open chat with yourself' }, { status: 400 })
    }

    const result = await withPgClient(async (client) => {
      await client.query('BEGIN')
      try {
        const usersExist = await client.query<{ id: string }>(
          'SELECT id FROM profiles WHERE id = ANY($1::uuid[])',
          [[user.id, targetUserId]]
        )
        if (usersExist.rowCount !== 2) {
          await client.query('ROLLBACK')
          return { notFound: true as const, conversationId: null as string | null }
        }

        const existing = await client.query<{ id: string }>(
          `
          SELECT c.id
          FROM conversations c
          JOIN matches m ON m.id = c.match_id
          WHERE (m.user1_id = $1 AND m.user2_id = $2)
             OR (m.user1_id = $2 AND m.user2_id = $1)
          LIMIT 1
          `,
          [user.id, targetUserId]
        )
        if (existing.rows[0]?.id) {
          await client.query('COMMIT')
          return { notFound: false as const, conversationId: existing.rows[0].id }
        }

        const [u1, u2] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id]
        const matchRes = await client.query<{ id: string }>(
          `
          INSERT INTO matches (user1_id, user2_id)
          VALUES ($1, $2)
          ON CONFLICT (user1_id, user2_id)
          DO UPDATE SET user1_id = EXCLUDED.user1_id
          RETURNING id
          `,
          [u1, u2]
        )
        const matchId = matchRes.rows[0]?.id
        if (!matchId) {
          throw new Error('Could not create or find match')
        }

        const convoRes = await client.query<{ id: string }>(
          `
          INSERT INTO conversations (match_id)
          VALUES ($1)
          ON CONFLICT (match_id) DO UPDATE SET match_id = EXCLUDED.match_id
          RETURNING id
          `,
          [matchId]
        )

        await client.query('COMMIT')
        return { notFound: false as const, conversationId: convoRes.rows[0]?.id ?? null }
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    })

    if (result.notFound) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, conversationId: result.conversationId })
  } catch (error) {
    console.error('POST /api/chat/open error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
