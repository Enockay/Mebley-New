import { NextRequest, NextResponse } from 'next/server'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { subscribeConversationMessages } from '@/lib/chat-events'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationId } = await context.params
    const conversationRes = await pgQuery<{
      user1_id: string
      user2_id: string
    }>(
      `
      SELECT m.user1_id, m.user2_id
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
    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        // Initial handshake event
        send('ready', { ok: true })

        const unsubscribe = subscribeConversationMessages(conversationId, (message) => {
          send('message', message)
        })

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(': ping\n\n'))
        }, 20000)

        const close = () => {
          clearInterval(heartbeat)
          unsubscribe()
          try {
            controller.close()
          } catch {
            // already closed
          }
        }

        request.signal.addEventListener('abort', close)
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('GET /api/chat/stream/[conversationId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

