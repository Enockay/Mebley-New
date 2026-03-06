import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMessages, saveMessage } from '@/lib/mongodb'

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

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`id, match_id, matches ( user1_id, user2_id )`)
      .eq('id', conversationId)
      .maybeSingle()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found', debug: convError }, { status: 404 })
    }

    const match = conversation.matches as any
    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messages = await getMessages(conversationId, 1, 50)
    return NextResponse.json({ messages: messages.reverse(), page: 1, limit: 50 })

  } catch (error) {
    console.error('GET messages error:', error)
    return NextResponse.json({ error: 'Internal server error', debug: String(error) }, { status: 500 })
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

    const body = await request.json()
    const { content, messageType = 'text' } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
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

    const receiverId = match.user1_id === user.id
      ? match.user2_id
      : match.user1_id

    const message = await saveMessage({
      conversationId,
      senderId: user.id,
      receiverId,
      content: content.trim(),
      messageType,
      isRead: false,
      isDeleted: false,
      participantIds: [match.user1_id, match.user2_id],
    })

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({
      message: {
        id: message._id?.toString(),
        conversationId: message.conversationId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        messageType: message.messageType,
        isRead: message.isRead,
        createdAt: message.createdAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('POST message error:', error)
    return NextResponse.json({ error: 'Internal server error', debug: String(error) }, { status: 500 })
  }
}