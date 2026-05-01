import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client } from '@aws-sdk/client-s3'

const region = process.env.AWS_REGION
const bucket = process.env.AWS_S3_BUCKET
const s3 = new S3Client({ region: region! })

function isValidBaseUrl(value: string | undefined): value is string {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 && normalized !== 'undefined' && normalized !== 'null'
}

function normalizeBaseUrl(rawValue: string | undefined): string {
  if (!isValidBaseUrl(rawValue)) return ''
  const trimmed = rawValue.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, messageId, fileType, mediaType } = await req.json()
  // mediaType: 'image' | 

  if (!conversationId || !messageId || !fileType || !mediaType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const ext      = fileType.split('/')[1] ?? 'bin'
  const s3Key    = `chat/${conversationId}/${messageId}/${mediaType}.${ext}`
  const cfBase = normalizeBaseUrl(process.env.CLOUDFRONT_URL)
    || normalizeBaseUrl(process.env.CLOUDFRONT_DOMAIN)

  // If CLOUDFRONT_URL isn't configured, fall back to the public S3 URL format.
  // This prevents `mediaUrl: undefined` in chat messages.
  const mediaBaseUrl = cfBase
    ? cfBase
    : `https://${bucket}.s3.${region}.amazonaws.com`

  if (!bucket || !region) {
    return NextResponse.json(
      { error: 'Missing AWS configuration (AWS_S3_BUCKET/AWS_REGION)' },
      { status: 500 }
    )
  }

  const { url, fields } = await createPresignedPost(s3, {
    Bucket:     bucket,
    Key:        s3Key,
    Conditions: [
      ['content-length-range', 0, 20 * 1024 * 1024], // 20MB max
      ['starts-with', '$Content-Type', fileType.split('/')[0]],
    ],
    Fields:  { 'Content-Type': fileType },
    Expires: 120,
  })

  return NextResponse.json({
    url,
    fields,
    s3Key,
    cloudfrontUrl: `${mediaBaseUrl}/${s3Key}`,
  })
}