/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/messages/[conversationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getMessages, saveMessage } from '@/lib/mongodb'
import { rateLimit } from '@/lib/rateLimit'
import { validateMessage } from '@/lib/validation'
import { notifyMessage } from '@/lib/notifications'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = rateLimit(user.id, 'api')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests', resetIn: limit.resetIn },
        { status: 429 }
      )
    }

    const conversationRes = await pgQuery<{
      id: string
      match_id: string
      user1_id: string
      user2_id: string
    }>(
      `
      SELECT c.id, c.match_id, m.user1_id, m.user2_id
      FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [conversationId]
    )
    const conversation = conversationRes.rows[0]

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const match = conversation
    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messages = await getMessages(conversationId, 1, 50)
    return NextResponse.json({ messages: messages.reverse(), page: 1, limit: 50 })

  } catch (error) {
    console.error('GET messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit messages — 30 per minute
    const limit = rateLimit(user.id, 'messages')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Sending too fast. Please slow down.', resetIn: limit.resetIn },
        { status: 429 }
      )
    }

    const body = await request.json()

    const isMediaMessage = ['image', 'gif', 'video_call'].includes(body.messageType)
    const validation = validateMessage(isMediaMessage ? (body.content || 'media') : body.content)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const messageType = body.messageType ?? 'text'
    const mediaUrl    = body.mediaUrl    ?? undefined
    const mediaKey    = body.mediaKey    ?? undefined
    const duration    = body.duration    ?? undefined
    const callStatus  = body.callStatus  ?? undefined
    const callDuration = body.callDuration ?? undefined

    const conversationRes = await pgQuery<{
      id: string
      match_id: string
      user1_id: string
      user2_id: string
    }>(
      `
      SELECT c.id, c.match_id, m.user1_id, m.user2_id
      FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [conversationId]
    )
    const conversation = conversationRes.rows[0]

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const match = conversation
    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const receiverId = match.user1_id === user.id
      ? match.user2_id
      : match.user1_id

    // Fetch sender name for notification
    const senderProfileRes = await pgQuery<{ full_name: string }>(
      'SELECT full_name FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const senderProfile = senderProfileRes.rows[0]

    const message = await saveMessage({
      conversationId,
      senderId:       user.id,
      receiverId,
      content:        validation.sanitized!,
      messageType,
      mediaUrl,
      mediaKey,
      duration,
      callStatus,
      callDuration,
      isRead:         false,
      isDeleted:      false,
      participantIds: [match.user1_id, match.user2_id],
    })

    await pgQuery(
      'UPDATE conversations SET updated_at = now() WHERE id = $1',
      [conversationId]
    )

    // Fire message notification — non-blocking, never fails the request
    if (senderProfile?.full_name) {
      notifyMessage(
        receiverId,
        senderProfile.full_name,
        validation.sanitized!,
        conversationId,
      ).catch(err => console.error('[notifyMessage] failed:', err))
    }

   return NextResponse.json({
    message: {
      id:             message._id?.toString(),
      conversationId: message.conversationId,
      senderId:       message.senderId,
      receiverId:     message.receiverId,
      content:        message.content,
      messageType:    message.messageType,
      mediaUrl:       message.mediaUrl,
      mediaKey:       message.mediaKey,
      duration:       message.duration,
      callStatus:     message.callStatus,
      callDuration:   message.callDuration,
      isRead:         message.isRead,
      createdAt:      message.createdAt,
    }
   }, { status: 201 })

  } catch (error) {
    console.error('POST message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
