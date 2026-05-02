/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/likes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { notifyMatch, notifyLike } from '@/lib/notifications'
import { insertUserNotification } from '@/lib/user-notifications'
import { withPgClient, pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import {
  STITCH_MATCH_CREDITS_PER_USER,
  STITCH_MATCH_REF,
} from '@/lib/stitch-match.constants'

type LikeTxResult =
  | {
      ok: true
      isMatch: boolean
      createdNewMatch: boolean
      conversationId: string | null
      stitchCreditsPerUser?: number
    }
  | { ok: false; code: 'insufficient_stitch'; balance: number; needed: number }

// ── GET — return all user IDs that the current user has already liked ─────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pgQuery<{ likee_id: string }>(
      `SELECT likee_id FROM likes WHERE liker_id = $1`,
      [user.id]
    )
    return NextResponse.json({ likedIds: res.rows.map(r => r.likee_id) })
  } catch (err) {
    console.error('GET /api/likes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type BasicProfileRow = {
  full_name: string
  photos: unknown[] | null
  tier: string | null
  plan: string | null
}

function isPremiumOrVip(row: BasicProfileRow): boolean {
  const t = (row.plan ?? row.tier ?? 'free').toLowerCase()
  return t === 'premium' || t === 'vip'
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit — max 100 likes per minute
    const limit = rateLimit(user.id, 'likes')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests', resetIn: limit.resetIn },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { likeeId, stitch = false, note = '' } = body

    if (!likeeId || typeof likeeId !== 'string') {
      return NextResponse.json({ error: 'likeeId is required' }, { status: 400 })
    }

    if (likeeId === user.id) {
      return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 })
    }

    // Stitch note validation
    const isStitch   = stitch === true
    const stitchNote = isStitch ? String(note ?? '').slice(0, 280).trim() : null
    if (isStitch && !stitchNote) {
      return NextResponse.json({ error: 'A Stitch requires a personal note' }, { status: 400 })
    }

    // Fetch both profiles in parallel
    const [likerRes, likeeRes] = await Promise.all([
      withPgClient((client) =>
        client.query<BasicProfileRow>(
          'SELECT full_name, photos, tier, plan FROM profiles WHERE id = $1 LIMIT 1',
          [user.id]
        )
      ),
      withPgClient((client) =>
        client.query<BasicProfileRow>(
          'SELECT full_name, photos, tier, plan FROM profiles WHERE id = $1 LIMIT 1',
          [likeeId]
        )
      ),
    ])

    const likerProfile = likerRes.rows[0]
    const likeeProfile = likeeRes.rows[0]

    if (!likerProfile || !likeeProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const likeResult: LikeTxResult = await withPgClient(async (client) => {
      await client.query('BEGIN')
      try {
        // Insert like — on conflict update stitch fields if this is an upgrade to a Stitch
        await client.query(
          `INSERT INTO likes (liker_id, likee_id, is_stitch, stitch_note)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (liker_id, likee_id) DO UPDATE
             SET is_stitch   = EXCLUDED.is_stitch,
                 stitch_note = EXCLUDED.stitch_note`,
          [user.id, likeeId, isStitch, stitchNote]
        )

        const mutualRes = await client.query<{ id: string; is_stitch: boolean }>(
          `SELECT id, is_stitch FROM likes WHERE liker_id = $1 AND likee_id = $2 LIMIT 1`,
          [likeeId, user.id]
        )

        if (!mutualRes.rowCount) {
          await client.query('COMMIT')
          return {
            ok: true,
            isMatch: false,
            createdNewMatch: false,
            conversationId: null,
          }
        }

        const [u1, u2] = user.id < likeeId ? [user.id, likeeId] : [likeeId, user.id]

        const existingMatch = await client.query<{ id: string }>(
          `SELECT id FROM matches WHERE user1_id = $1 AND user2_id = $2 LIMIT 1`,
          [u1, u2]
        )

        let conversationId: string | null = null

        if (existingMatch.rows[0]?.id) {
          const convRes = await client.query<{ id: string }>(
            `SELECT c.id FROM conversations c WHERE c.match_id = $1 LIMIT 1`,
            [existingMatch.rows[0].id]
          )
          conversationId = convRes.rows[0]?.id ?? null
          await client.query('COMMIT')
          return {
            ok: true,
            isMatch: true,
            createdNewMatch: false,
            conversationId,
          }
        }

        const reciprocalStitch = mutualRes.rows[0]?.is_stitch ?? false
        const isStitchMatch    = isStitch || reciprocalStitch

        if (isStitchMatch) {
          const cost = STITCH_MATCH_CREDITS_PER_USER
          for (const uid of [u1, u2]) {
            await client.query(
              `INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
               VALUES ($1, 0, 0, 0)
               ON CONFLICT (user_id) DO NOTHING`,
              [uid]
            )
          }

          const wFirst = await client.query<{ id: string; balance: number; lifetime_spent: number }>(
            `SELECT id, balance, lifetime_spent FROM credit_wallets WHERE user_id = $1 FOR UPDATE`,
            [u1]
          )
          const wSecond = await client.query<{ id: string; balance: number; lifetime_spent: number }>(
            `SELECT id, balance, lifetime_spent FROM credit_wallets WHERE user_id = $1 FOR UPDATE`,
            [u2]
          )

          const wallet1 = wFirst.rows[0]
          const wallet2 = wSecond.rows[0]
          const b1      = wallet1?.balance ?? 0
          const b2      = wallet2?.balance ?? 0

          if (!wallet1 || !wallet2 || b1 < cost || b2 < cost) {
            await client.query('ROLLBACK')
            const likerBalance = user.id === u1 ? b1 : b2
            return {
              ok: false,
              code: 'insufficient_stitch',
              balance: likerBalance,
              needed: cost,
            }
          }

          const nb1 = b1 - cost
          const nb2 = b2 - cost

          await client.query(
            `UPDATE credit_wallets
             SET balance = $1, lifetime_spent = $2, updated_at = NOW()
             WHERE id = $3`,
            [nb1, wallet1.lifetime_spent + cost, wallet1.id]
          )
          await client.query(
            `UPDATE credit_wallets
             SET balance = $1, lifetime_spent = $2, updated_at = NOW()
             WHERE id = $3`,
            [nb2, wallet2.lifetime_spent + cost, wallet2.id]
          )

          const desc = `Stitch match (${cost} credits each)`
          await client.query(
            `INSERT INTO credit_transactions
               (user_id, amount, balance_after, type, reference_type, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              u1,
              -cost,
              nb1,
              'premium_action_spend',
              STITCH_MATCH_REF,
              desc,
            ]
          )
          await client.query(
            `INSERT INTO credit_transactions
               (user_id, amount, balance_after, type, reference_type, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              u2,
              -cost,
              nb2,
              'premium_action_spend',
              STITCH_MATCH_REF,
              desc,
            ]
          )
        }

        const matchRes = await client.query<{ id: string }>(
          `INSERT INTO matches (user1_id, user2_id)
           VALUES ($1, $2)
           ON CONFLICT (user1_id, user2_id)
           DO UPDATE SET user1_id = EXCLUDED.user1_id
           RETURNING id`,
          [u1, u2]
        )
        const matchId = matchRes.rows[0]?.id

        if (matchId) {
          const convoRes = await client.query<{ id: string }>(
            `INSERT INTO conversations (match_id)
             VALUES ($1)
             ON CONFLICT (match_id) DO UPDATE SET match_id = EXCLUDED.match_id
             RETURNING id`,
            [matchId]
          )
          conversationId = convoRes.rows[0]?.id ?? null
        }

        await client.query('COMMIT')
        return {
          ok: true,
          isMatch: true,
          createdNewMatch: true,
          conversationId,
          stitchCreditsPerUser: isStitchMatch ? STITCH_MATCH_CREDITS_PER_USER : undefined,
        }
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    })

    if (!likeResult.ok) {
      return NextResponse.json(
        {
          error:
            `Stitch matches cost ${STITCH_MATCH_CREDITS_PER_USER} credits from each person. One or both of you need more credits.`,
          balance: likeResult.balance,
          needed: likeResult.needed,
        },
        { status: 402 }
      )
    }

    const { isMatch, conversationId, createdNewMatch, stitchCreditsPerUser } = likeResult

    if (createdNewMatch && isMatch) {
      notifyMatch(
        user.id,
        likeeId,
        likerProfile.full_name,
        likeeProfile.full_name,
      ).catch(err => console.error('[notifyMatch] failed:', err))

      Promise.all([
        insertUserNotification({
          userId: user.id,
          type:   'match',
          title:  "It's a match!",
          body:   `You and ${likeeProfile.full_name} liked each other.`,
          actorId: likeeId,
          data: conversationId ? { conversationId } : {},
        }),
        insertUserNotification({
          userId: likeeId,
          type:   'match',
          title:  "It's a match!",
          body:   `You and ${likerProfile.full_name} liked each other.`,
          actorId: user.id,
          data: conversationId ? { conversationId } : {},
        }),
      ]).catch(err => console.error('[user_notifications match]', err))
    } else if (!isMatch) {
      const likerPhotoUrl = Array.isArray(likerProfile.photos) && likerProfile.photos.length > 0
        ? (likerProfile.photos[0] as any)?.url ?? null
        : null

      notifyLike(
        likeeId,
        likerProfile.full_name,
        likerPhotoUrl,
        likeeProfile.plan ?? likeeProfile.tier ?? 'free',
      ).catch(err => console.error('[notifyLike] failed:', err))

      const likeePaid = isPremiumOrVip(likeeProfile)
      insertUserNotification({
        userId: likeeId,
        type:   'like',
        title:  likeePaid ? `${likerProfile.full_name} liked you` : 'Someone liked you',
        body:   likeePaid
          ? 'Say hello from Matches → Liked Me.'
          : 'Check Liked Me to see who’s interested — Premium shows names.',
        actorId: likeePaid ? user.id : null,
        data:    { revealed: likeePaid },
      }).catch(err => console.error('[user_notifications like]', err))
    }

    return NextResponse.json({
      success: true,
      isMatch,
      createdNewMatch,
      isStitch,
      stitchCreditsPerUser,
      conversationId,
      matchedProfile: isMatch ? {
        full_name: likeeProfile.full_name,
        photos:    likeeProfile.photos,
      } : null,
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/likes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
