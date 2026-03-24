import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import {
  RekognitionClient,
  DetectFacesCommand,
  Attribute,
} from '@aws-sdk/client-rekognition'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// ── Face detection helper ─────────────────────────────────────────
// Returns { valid: true } if at least one face found with confidence >= 80%
// Returns { valid: false, reason: string } otherwise
async function checkFacePresent(s3Key: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const command = new DetectFacesCommand({
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET!,
          Name:   s3Key,
        },
      },
      Attributes: [Attribute.DEFAULT],
    })

    const result = await rekognition.send(command)
    const faces  = result.FaceDetails ?? []

    if (faces.length === 0) {
      return { valid: false, reason: 'No face detected. Please upload a clear photo of yourself.' }
    }

    // Require at least one face with confidence >= 80%
    const confident = faces.filter(f => (f.Confidence ?? 0) >= 80)
    if (confident.length === 0) {
      return { valid: false, reason: 'Photo is too unclear. Please use a well-lit, front-facing photo.' }
    }

    // Optional: reject if multiple faces detected (group photos)
    if (faces.length > 1) {
      return { valid: false, reason: 'Multiple faces detected. Please upload a photo with just yourself.' }
    }

    return { valid: true }

  } catch (err: any) {
    // If Rekognition fails (e.g. unsupported format like HEIC), allow through
    // rather than blocking the user — log the error for monitoring
    console.error('[Rekognition] DetectFaces error:', err.message)
    return { valid: true }  // fail open — better UX than hard blocking
  }
}

// ── POST — confirm upload + face check ───────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slot, s3Key, cloudfrontUrl } = await request.json()

    // ── Rekognition face check ────────────────────────────────────
    // Only run on slot 0 (profile picture) — skip for additional photos
    if (slot === 0) {
      const faceCheck = await checkFacePresent(s3Key)
      if (!faceCheck.valid) {
        // Delete the uploaded file from S3 — don't leave invalid photos
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key:    s3Key,
          }))
        } catch {
          // Non-fatal
        }
        return NextResponse.json(
          { error: faceCheck.reason },
          { status: 400 }
        )
      }
    }

    // ── Save to profiles.photos array ────────────────────────────
    const profileRes = await pgQuery<{ photos: { slot: number; url: string; s3Key: string }[] | null }>(
      'SELECT photos FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const profile = profileRes.rows[0]

    const photos: { slot: number; url: string; s3Key: string }[] =
      (profile?.photos as any[] ?? []).filter(Boolean)

    // Remove old photo in this slot from S3
    const existing = photos.find(p => p.slot === slot)
    if (existing?.s3Key) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key:    existing.s3Key,
        }))
      } catch {
        // Non-fatal
      }
    }

    const updatedPhotos = [
      ...photos.filter(p => p.slot !== slot),
      { slot, url: cloudfrontUrl, s3Key },
    ].sort((a, b) => a.slot - b.slot)

    await pgQuery(
      'UPDATE profiles SET photos = $1, updated_at = now() WHERE id = $2',
      [updatedPhotos, user.id]
    )

    return NextResponse.json({ success: true, photos: updatedPhotos })

  } catch (error) {
    console.error('Photo confirm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE — remove a photo slot ─────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slot } = await request.json()

    const profileRes = await pgQuery<{ photos: { slot: number; url: string; s3Key: string }[] | null }>(
      'SELECT photos FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const profile = profileRes.rows[0]

    const photos: { slot: number; url: string; s3Key: string }[] =
      (profile?.photos as any[] ?? []).filter(Boolean)

    const existing = photos.find(p => p.slot === slot)
    if (existing?.s3Key) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key:    existing.s3Key,
        }))
      } catch {}
    }

    const updatedPhotos = photos.filter(p => p.slot !== slot)

    await pgQuery(
      'UPDATE profiles SET photos = $1, updated_at = now() WHERE id = $2',
      [updatedPhotos, user.id]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Photo delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
