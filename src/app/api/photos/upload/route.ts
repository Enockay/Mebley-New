import { NextRequest, NextResponse } from 'next/server'
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rateLimit'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = rateLimit(user.id, 'api')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { slot, fileType, fileSize } = await request.json()

    // slot 0 = profile picture, slots 1-5 = additional photos
    if (![0, 1, 2, 3, 4, 5].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot (0–5)' }, { status: 400 })
    }

    const normalizedType = (fileType as string).split(';')[0].trim().toLowerCase()
    if (!ALLOWED_TYPES.includes(normalizedType)) {
      return NextResponse.json(
        { error: `Unsupported format: ${fileType}. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      )
    }

    if (fileSize > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    const ext    = normalizedType.includes('png') ? 'png' : normalizedType.includes('webp') ? 'webp' : 'jpg'
    const s3Key  = `photos/${user.id}/slot-${slot}-${Date.now()}.${ext}`

    const { url, fields } = await createPresignedPost(s3, {
      Bucket:  process.env.AWS_S3_BUCKET!,
      Key:     s3Key,
      Expires: 300,
      Conditions: [
        ['content-length-range', 0, MAX_SIZE],
        ['starts-with', '$Content-Type', 'image/'],
      ],
      Fields: {
        'Content-Type': normalizedType,
        'x-amz-meta-userId': user.id,
        'x-amz-meta-slot':   slot.toString(),
      },
    })

    const cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`

    return NextResponse.json({ url, fields, s3Key, cloudfrontUrl })

  } catch (error) {
    console.error('Photo upload URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
