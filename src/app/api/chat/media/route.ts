import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION! })

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, messageId, fileType, mediaType } = await req.json()
  // mediaType: 'image' | 

  if (!conversationId || !messageId || !fileType || !mediaType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const ext      = fileType.split('/')[1] ?? 'bin'
  const s3Key    = `chat/${conversationId}/${messageId}/${mediaType}.${ext}`
  const bucket   = process.env.AWS_S3_BUCKET!
  const cfBase   = process.env.CLOUDFRONT_URL!

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
    cloudfrontUrl: `${cfBase}/${s3Key}`,
  })
}