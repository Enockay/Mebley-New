import { NextRequest, NextResponse } from 'next/server'
import { withPgClient } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import {
  DISCOVER_MESSAGE_START_CREDITS,
  DISCOVER_MESSAGE_START_REF,
} from '@/lib/discover-message-start.constants'

type OpenResult =
  | { kind: 'existing'; conversationId: string }
  | { kind: 'insufficient'; balance: number; needed: number }
  | { kind: 'created'; conversationId: string; spentCredits: number }
  | { kind: 'not_found' }

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

    const COST = DISCOVER_MESSAGE_START_CREDITS

    const result = await withPgClient(async (client) => {
      await client.query('BEGIN')
      try {
        const usersExist = await client.query<{ id: string }>(
          'SELECT id FROM profiles WHERE id = ANY($1::uuid[])',
          [[user.id, targetUserId]]
        )
        if (usersExist.rowCount !== 2) {
          await client.query('ROLLBACK')
          return { kind: 'not_found' } satisfies OpenResult
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
          return { kind: 'existing', conversationId: existing.rows[0].id } satisfies OpenResult
        }

        await client.query(
          `INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
           VALUES ($1, 0, 0, 0)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id]
        )

        const walletRes = await client.query<{ id: string; balance: number; lifetime_spent: number }>(
          `SELECT id, balance, lifetime_spent FROM credit_wallets WHERE user_id = $1 FOR UPDATE`,
          [user.id]
        )
        const wallet = walletRes.rows[0]
        const bal = wallet?.balance ?? 0

        if (!wallet || bal < COST) {
          await client.query('ROLLBACK')
          return { kind: 'insufficient', balance: bal, needed: COST } satisfies OpenResult
        }

        const newBalance = bal - COST

        await client.query(
          `UPDATE credit_wallets
           SET balance = $1, lifetime_spent = $2, updated_at = NOW()
           WHERE id = $3`,
          [newBalance, wallet.lifetime_spent + COST, wallet.id]
        )

        await client.query(
          `INSERT INTO credit_transactions
             (user_id, amount, balance_after, type, reference_type, description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            user.id,
            -COST,
            newBalance,
            'premium_action_spend',
            DISCOVER_MESSAGE_START_REF,
            `Started a conversation from Discover (${COST} credits)`,
          ]
        )

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

        const conversationId = convoRes.rows[0]?.id ?? null
        if (!conversationId) {
          throw new Error('Could not create conversation')
        }

        await client.query('COMMIT')
        return {
          kind:             'created',
          conversationId,
          spentCredits:     COST,
        } satisfies OpenResult
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    })

    if (result.kind === 'not_found') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (result.kind === 'insufficient') {
      return NextResponse.json(
        {
          error:   'Insufficient credits',
          balance: result.balance,
          needed:  result.needed,
          message: `${DISCOVER_MESSAGE_START_CREDITS} credits are required to start this conversation.`,
        },
        { status: 402 }
      )
    }

    return NextResponse.json({
      success:          true,
      conversationId:   result.conversationId,
      spentCredits:     result.kind === 'created' ? result.spentCredits : 0,
    })
  } catch (error) {
    console.error('POST /api/chat/open error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
