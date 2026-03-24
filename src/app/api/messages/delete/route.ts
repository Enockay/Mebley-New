/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/messages/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
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
    await pgQuery(
      'UPDATE conversations SET updated_at = now() WHERE id = $1',
      [conversationId]
    )

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
