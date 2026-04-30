import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import clientPromise from '@/lib/mongodb'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest, clearAuthCookie } from '@/lib/auth-server'
import { recordConsistencyIssue } from '@/lib/consistency'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function DELETE(request: NextRequest) {
  try {
    // ── 1. Verify the requesting user is authenticated ────────────
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const errors: string[] = []

    // ── 2. Fetch profile to get photo s3Keys ──────────────────────
    const profileRes = await pgQuery<{ photos: unknown[] | null }>(
      'SELECT photos FROM profiles WHERE id = $1 LIMIT 1',
      [userId]
    )
    const profile = profileRes.rows[0]

    // ── 3. Delete all S3 photos ───────────────────────────────────
    const photos = (profile?.photos as any[] ?? []).filter(Boolean)
    const s3Keys = photos.map((p: any) => p.s3Key).filter(Boolean)

    if (s3Keys.length > 0) {
      try {
        if (s3Keys.length === 1) {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key:    s3Keys[0],
          }))
        } else {
          await s3.send(new DeleteObjectsCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Delete: {
              Objects: s3Keys.map(Key => ({ Key })),
              Quiet:   true,
            },
          }))
        }
      } catch (err: any) {
        // Non-fatal — log and continue
        console.error('[Delete] S3 error:', err.message)
        errors.push('Some photos could not be deleted')
        await recordConsistencyIssue({
          entityType: 'user_account',
          entityId: userId,
          source: 'account_delete:s3_photos',
          details: { error: err.message, keyCount: s3Keys.length },
        })
      }
    }

    // ── 4. Delete profile videos from S3 ─────────────────────────
    try {
      const videosRes = await pgQuery<{ s3_key: string | null }>(
        'SELECT s3_key FROM profile_videos WHERE user_id = $1',
        [userId]
      )
      const videos = videosRes.rows

      if (videos && videos.length > 0) {
        const videoKeys = videos.map((v: any) => v.s3_key).filter(Boolean)
        if (videoKeys.length > 0) {
          await s3.send(new DeleteObjectsCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Delete: { Objects: videoKeys.map((Key: string) => ({ Key })), Quiet: true },
          }))
        }
      }
    } catch (err: any) {
      console.error('[Delete] Video S3 error:', err.message)
      errors.push('Some videos could not be deleted')
      await recordConsistencyIssue({
        entityType: 'user_account',
        entityId: userId,
        source: 'account_delete:s3_videos',
        details: { error: err.message },
      })
    }

    // ── 5. Delete MongoDB messages ────────────────────────────────
    try {
      const mongoClient = await clientPromise
      const db = mongoClient.db()

      // Delete all messages sent or received by this user
      await db.collection('messages').deleteMany({
        $or: [{ senderId: userId }, { receiverId: userId }]
      })

      // Delete conversation records involving this user
      await db.collection('conversations').deleteMany({
        participants: userId
      })

    } catch (err: any) {
      console.error('[Delete] MongoDB error:', err.message)
      errors.push('Some messages could not be deleted')
      await recordConsistencyIssue({
        entityType: 'user_account',
        entityId: userId,
        source: 'account_delete:mongodb',
        severity: 'critical',
        details: { error: err.message },
      })
    }

    // ── 6. Delete profile row (cascades to matches, likes, blocked_users) ─────
    try {
      await pgQuery('DELETE FROM profiles WHERE id = $1', [userId])
    } catch (err: any) {
      console.error('[Delete] Profile row error:', err.message)
    }

    // ── 7. Delete app_users row (cascades auth_sessions via FK) ──────────────
    try {
      await pgQuery('DELETE FROM app_users WHERE id = $1', [userId])
    } catch (err: any) {
      console.error('[Delete] app_users row error:', err.message)
      return NextResponse.json(
        { error: 'Failed to delete account. Please contact support.' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      success: true,
      warnings: errors.length > 0 ? errors : undefined,
    })
    // Clear the session cookie so the client is logged out immediately
    clearAuthCookie(response)
    return response

  } catch (error: any) {
    console.error('[Delete] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
