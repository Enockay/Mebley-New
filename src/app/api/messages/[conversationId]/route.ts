/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/messages/[conversationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMessages, saveMessage } from '@/lib/mongodb'
import { rateLimit } from '@/lib/rateLimit'
import { validateMessage } from '@/lib/validation'
import { notifyMessage } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    const { data: conversation } = await supabase
      .from('conversations')
      .select(`id, match_id, matches ( user1_id, user2_id )`)
      .eq('id', conversationId)
      .maybeSingle()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const match = conversation.matches as any
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
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    const isMediaMessage = ['image', 'gif', 'voice', 'video_call'].includes(body.messageType)
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

    const { data: conversation } = await supabase
      .from('conversations')
      .select(`id, match_id, matches ( user1_id, user2_id )`)
      .eq('id', conversationId)
      .maybeSingle()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const match = conversation.matches as any
    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const receiverId = match.user1_id === user.id
      ? match.user2_id
      : match.user1_id

    // Fetch sender name for notification
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

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

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

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
