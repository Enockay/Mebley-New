/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/messages/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messageId, conversationId } = await req.json()
  if (!messageId || !conversationId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const collection = db.collection('messages')

    // Only allow deleting own messages
    const result = await collection.updateOne(
      {
        _id:             new ObjectId(messageId),
        senderId:        user.id,
        conversationId,
        isDeleted:       false,
      },
      {
        $set: {
          isDeleted:  true,
          deletedAt:  new Date(),
          content:    'This message was deleted',
          updatedAt:  new Date(),
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Message not found or already deleted' }, { status: 404 })
    }

    // Update conversation updated_at to trigger realtime
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
