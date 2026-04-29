import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cloudfrontUrl } = await request.json()
    if (!cloudfrontUrl || typeof cloudfrontUrl !== 'string') {
      return NextResponse.json({ error: 'cloudfrontUrl is required' }, { status: 400 })
    }

    // Basic safety: only allow URLs from our own CloudFront domain
    const domain = process.env.CLOUDFRONT_DOMAIN ?? ''
    if (!cloudfrontUrl.startsWith(`https://${domain}/voice-notes/`)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    await pgQuery(
      'UPDATE profiles SET voice_note_url = $1, updated_at = now() WHERE id = $2',
      [cloudfrontUrl, user.id]
    )

    return NextResponse.json({ success: true, url: cloudfrontUrl })
  } catch (error) {
    console.error('[voice/confirm]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pgQuery(
      'UPDATE profiles SET voice_note_url = NULL, updated_at = now() WHERE id = $1',
      [user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[voice/confirm DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
