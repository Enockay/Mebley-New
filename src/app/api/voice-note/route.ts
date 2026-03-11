import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION! })

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// GET — fetch existing voice note
export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('voice_notes')
    .select('cloudfront_url')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!data) return NextResponse.json({ url: null })
  return NextResponse.json({ url: data.cloudfront_url })
}

// POST — upload voice note
export async function POST(req: NextRequest) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as Blob | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer  = Buffer.from(await file.arrayBuffer())
  const s3Key   = `voice-notes/${user.id}/note.webm`
  const bucket  = process.env.AWS_S3_BUCKET!
  const cfBase  = process.env.CLOUDFRONT_URL!

  await s3.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         s3Key,
    Body:        buffer,
    ContentType: 'audio/webm',
  }))

  const cloudfrontUrl = `${cfBase}/${s3Key}`

  // Upsert — one voice note per user
  await supabase.from('voice_notes').upsert({
    user_id:        user.id,
    s3_key:         s3Key,
    cloudfront_url: cloudfrontUrl,
    status:         'active',
    visibility:     'matches_only',
    updated_at:     new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.json({ url: cloudfrontUrl })
}

// DELETE — remove voice note
export async function DELETE() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('voice_notes')
    .select('s3_key')
    .eq('user_id', user.id)
    .single()

  if (data?.s3_key) {
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key:    data.s3_key,
    }))
  }

  await supabase.from('voice_notes')
    .update({ status: 'deleted' })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
