import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { MongoClient } from 'mongodb'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// ── Admin client — needed to delete auth.users ────────────────────
// Uses service_role key, only safe server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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
    }

    // ── 5. Delete MongoDB messages ────────────────────────────────
    try {
      const mongoClient = new MongoClient(process.env.MONGODB_URI!)
      await mongoClient.connect()
      const db = mongoClient.db()

      // Delete all messages sent or received by this user
      await db.collection('messages').deleteMany({
        $or: [{ senderId: userId }, { receiverId: userId }]
      })

      // Delete conversation records involving this user
      await db.collection('conversations').deleteMany({
        participants: userId
      })

      await mongoClient.close()
    } catch (err: any) {
      console.error('[Delete] MongoDB error:', err.message)
      errors.push('Some messages could not be deleted')
    }

    // ── 6. Delete Supabase rows (cascade handles most) ────────────
    // profiles row deletion cascades to: matches, likes, blocked_users,
    // profile_videos (via FK). pending_profiles cascades via auth.users.
    try {
      await pgQuery('DELETE FROM profiles WHERE id = $1', [userId])
    } catch (err: any) {
      console.error('[Delete] Profile row error:', err.message)
    }

    // ── 7. Delete auth.users — must be last ───────────────────────
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('[Delete] Auth user error:', authDeleteError.message)
      return NextResponse.json(
        { error: 'Failed to delete account. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      warnings: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    console.error('[Delete] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
