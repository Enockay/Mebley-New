import { NextRequest, NextResponse } from 'next/server'
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { rateLimit } from '@/lib/rateLimit'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_MIME_BASES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/3gpp',
  'video/3gpp2',
  'video/mpeg',
  'video/ogg',
]

const EXT_MAP: Record<string, string> = {
  'video/mp4':        'mp4',
  'video/quicktime':  'mov',
  'video/webm':       'webm',
  'video/x-matroska': 'webm',
  'video/3gpp':       'mp4',
  'video/3gpp2':      'mp4',
  'video/mpeg':       'mp4',
  'video/ogg':        'ogg',
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = rateLimit(user.id, 'api')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const { slot, fileType, fileSize } = body

    if (![0, 1, 2].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
    }

    // Normalize MIME — strip codec params
    const normalizedType = (fileType as string).split(';')[0].trim().toLowerCase()

    if (!ALLOWED_MIME_BASES.includes(normalizedType)) {
      return NextResponse.json(
        { error: `Unsupported format: ${fileType}` },
        { status: 400 }
      )
    }

    if (fileSize > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum 100MB.' },
        { status: 400 }
      )
    }

    const ext   = EXT_MAP[normalizedType] ?? 'mp4'
    const s3Key = `videos/${user.id}/slot-${slot}-${Date.now()}.${ext}`

    // Use createPresignedPost — uses POST/multipart which has no checksum issues
    const { url, fields } = await createPresignedPost(s3, {
      Bucket:  process.env.AWS_S3_BUCKET!,
      Key:     s3Key,
      Expires: 600,
      Conditions: [
        ['content-length-range', 0, 100 * 1024 * 1024],
        ['starts-with', '$Content-Type', 'video/'],
      ],
      Fields: {
        'Content-Type': normalizedType,
        'x-amz-meta-userId': user.id,
        'x-amz-meta-slot':   slot.toString(),
      },
    })

    const cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`

    console.log('Presigned POST generated for slot', slot, '— key:', s3Key)

    return NextResponse.json({ url, fields, s3Key, cloudfrontUrl })

  } catch (error) {
    console.error('Upload URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
