import { NextRequest, NextResponse } from 'next/server'
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { rateLimit } from '@/lib/rateLimit'
import { getAuthUserFromRequest } from '@/lib/auth-server'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/wav']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB — 30s compressed audio is well under 1 MB

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = rateLimit(user.id, 'api')
    if (!limit.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { fileType, fileSize } = await request.json()

    const normalizedType = String(fileType ?? '').split(';')[0].trim().toLowerCase()
    const baseType = normalizedType.split('/')[0]
    if (baseType !== 'audio' && !ALLOWED_TYPES.includes(normalizedType)) {
      return NextResponse.json({ error: `Unsupported audio format: ${fileType}` }, { status: 400 })
    }

    if (Number(fileSize) > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 5 MB.' }, { status: 400 })
    }

    const ext    = normalizedType.includes('mp4') ? 'm4a' : normalizedType.includes('ogg') ? 'ogg' : 'webm'
    const s3Key  = `voice-notes/${user.id}/voice-${Date.now()}.${ext}`

    const { url, fields } = await createPresignedPost(s3, {
      Bucket:  process.env.AWS_S3_BUCKET!,
      Key:     s3Key,
      Expires: 300,
      Conditions: [
        ['content-length-range', 0, MAX_SIZE],
        ['starts-with', '$Content-Type', 'audio/'],
      ],
      Fields: {
        'Content-Type':       normalizedType,
        'x-amz-meta-userId':  user.id,
        'x-amz-meta-purpose': 'voice_note',
      },
    })

    const cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`
    return NextResponse.json({ url, fields, s3Key, cloudfrontUrl })

  } catch (error) {
    console.error('[voice/upload]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
