/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'
import { getMessages } from '@/lib/mongodb'

type ConversationRow = {
  conversation_id: string
  other_id: string
  full_name: string
  photos: unknown[] | null
  location: string | null
  age_range: string | null
  gender: string | null
  bio: string | null
  nationality: string | null
  interests: string[] | null
  looking_for: string[] | null
  prompts: unknown[] | null
  last_active: string | null
  is_pinned_by: string[] | null
  is_muted_by: string[] | null
  is_archived_by: string[] | null
  updated_at: string | null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await pgQuery<ConversationRow>(
      `
      SELECT
        c.id AS conversation_id,
        CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END AS other_id,
        p.full_name,
        p.photos,
        p.location,
        p.age_range,
        p.gender,
        p.bio,
        p.nationality,
        p.interests,
        p.looking_for,
        p.prompts,
        p.last_active::text,
        c.is_pinned_by,
        c.is_muted_by,
        c.is_archived_by,
        c.updated_at::text
      FROM matches m
      JOIN conversations c ON c.match_id = m.id
      JOIN profiles p ON p.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
      WHERE (m.user1_id = $1 OR m.user2_id = $1)
        AND NOT EXISTS (
          SELECT 1
          FROM blocked_users b
          WHERE b.blocker_id = $1
            AND b.blocked_id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
        )
      ORDER BY c.updated_at DESC
      `,
      [user.id]
    )

    const conversations = await Promise.all(rows.rows.map(async (row) => {
      let lastMessage = 'Say hello 👋'
      let lastTime = row.updated_at ?? ''
      let unreadCount = 0
      try {
        const messages = await getMessages(row.conversation_id, 1, 1)
        const msg = messages[0]
        if (msg) {
          lastMessage = msg.isDeleted
            ? 'Message deleted'
            : msg.messageType === 'image'
              ? '📷 Photo'
              : msg.messageType === 'gif'
                ? '🎞️ GIF'
                : msg.messageType === 'audio'
                  ? '🎤 Voice note'
                  : msg.messageType === 'video_call'
                    ? '📹 Video call'
                    : msg.content
          lastTime = msg.createdAt?.toISOString?.() ?? String(msg.createdAt ?? lastTime)
          unreadCount = msg.senderId !== user.id && !msg.isRead ? 1 : 0
        }
      } catch {
        // ignore message metadata errors
      }

      return {
        conversationId: row.conversation_id,
        profile: {
          id: row.other_id,
          full_name: row.full_name,
          photos: row.photos ?? [],
          location: row.location,
          age_range: row.age_range,
          gender: row.gender,
          bio: row.bio,
          nationality: row.nationality,
          interests: row.interests ?? [],
          looking_for: row.looking_for ?? [],
          prompts: row.prompts ?? [],
          last_active: row.last_active,
        },
        lastMessage,
        lastTime,
        unreadCount,
        isPinned: (row.is_pinned_by ?? []).includes(user.id),
        isMuted: (row.is_muted_by ?? []).includes(user.id),
        isArchived: (row.is_archived_by ?? []).includes(user.id),
        isPendingLike: false,
      }
    }))

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('GET /api/chat/conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

