import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slot, s3Key, cloudfrontUrl } = await request.json()

    // Get current photos array
    const { data: profile } = await supabase
      .from('profiles')
      .select('photos')
      .eq('id', user.id)
      .single()

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
        // Non-fatal — old file may already be gone
      }
    }

    // Replace slot in photos array
    const updatedPhotos = [
      ...photos.filter(p => p.slot !== slot),
      { slot, url: cloudfrontUrl, s3Key },
    ].sort((a, b) => a.slot - b.slot)

    const { error } = await supabase
      .from('profiles')
      .update({ photos: updatedPhotos })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, photos: updatedPhotos })

  } catch (error) {
    console.error('Photo confirm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slot } = await request.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('photos')
      .eq('id', user.id)
      .single()

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

    await supabase
      .from('profiles')
      .update({ photos: updatedPhotos })
      .eq('id', user.id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Photo delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
