import { NextRequest, NextResponse } from 'next/server'
import {
  RekognitionClient,
  CompareFacesCommand,
} from '@aws-sdk/client-rekognition'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// GET — return current verification status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pgQuery<{ photo_verified: boolean; verification_submitted_at: string | null }>(
      'SELECT photo_verified, verification_submitted_at FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const profile = res.rows[0]
    return NextResponse.json({
      verified:    profile?.photo_verified ?? false,
      submittedAt: profile?.verification_submitted_at ?? null,
    })
  } catch (err) {
    console.error('[verification/selfie GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — verify selfie against profile photo using Rekognition CompareFaces
// Expects FormData with a 'selfie' File field
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the selfie from FormData
    const formData = await request.formData()
    const selfieFile = formData.get('selfie') as File | null
    if (!selfieFile) {
      return NextResponse.json({ error: 'No selfie file provided' }, { status: 400 })
    }

    if (selfieFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }

    // Get profile primary photo S3 key
    const profileRes = await pgQuery<{ photos: { slot: number; url: string; s3Key: string }[] | null }>(
      'SELECT photos FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const profile = profileRes.rows[0]
    const photos = (profile?.photos as any[] ?? []).filter(Boolean)
    const primaryPhoto = photos.find((p: any) => p.slot === 0)

    if (!primaryPhoto?.s3Key) {
      return NextResponse.json(
        { error: 'Please upload a profile photo (slot 0) before verifying.' },
        { status: 400 }
      )
    }

    // Convert selfie to Buffer for Rekognition
    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer())

    // Mark submitted timestamp immediately (so UI shows "pending")
    await pgQuery(
      'UPDATE profiles SET verification_submitted_at = NOW() WHERE id = $1',
      [user.id]
    )

    // CompareFaces: source = selfie bytes, target = profile photo in S3
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: selfieBuffer },
      TargetImage: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET!,
          Name:   primaryPhoto.s3Key,
        },
      },
      SimilarityThreshold: 70,
    })

    let similarity = 0
    let verified   = false

    try {
      const result = await rekognition.send(command)
      const matches = result.FaceMatches ?? []
      if (matches.length > 0) {
        similarity = matches[0].Similarity ?? 0
        verified   = similarity >= 80
      }
    } catch (rekErr: any) {
      console.error('[Rekognition] CompareFaces error:', rekErr.message)
      // Fail open only if Rekognition is unavailable (service error), not if no face found
      if (rekErr.name === 'InvalidParameterException' || rekErr.name === 'InvalidImageFormatException') {
        return NextResponse.json({ error: 'Could not read photo — use a clear JPEG or PNG selfie.' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Verification service unavailable. Try again later.' }, { status: 503 })
    }

    if (verified) {
      await pgQuery(
        'UPDATE profiles SET photo_verified = true, updated_at = NOW() WHERE id = $1',
        [user.id]
      )
    }

    return NextResponse.json({
      verified,
      similarity:  Math.round(similarity),
      message: verified
        ? 'Identity verified! Your profile now shows a verified badge.'
        : 'Selfie did not match your profile photo. Make sure you\'re in good lighting and looking at the camera.',
    })

  } catch (err) {
    console.error('[verification/selfie POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
