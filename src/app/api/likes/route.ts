// src/app/api/likes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rateLimit'
import { notifyMatch, notifyLike } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit — max 100 likes per minute (prevents bot abuse)
    const limit = rateLimit(user.id, 'likes')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests', resetIn: limit.resetIn },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { likeeId } = body

    if (!likeeId || typeof likeeId !== 'string') {
      return NextResponse.json({ error: 'likeeId is required' }, { status: 400 })
    }

    // Prevent self-liking
    if (likeeId === user.id) {
      return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 })
    }

    // Fetch both profiles in parallel — need names, photos, tier
    const [likerResult, likeeResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, photos, tier')
        .eq('id', user.id)
        .single(),
      supabase
        .from('profiles')
        .select('full_name, photos, tier')
        .eq('id', likeeId)
        .single(),
    ])

    const likerProfile = likerResult.data
    const likeeProfile = likeeResult.data

    if (!likerProfile || !likeeProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Insert like — ignore duplicate (23505 = unique violation)
    const { error: likeError } = await supabase
      .from('likes')
      .insert({ liker_id: user.id, likee_id: likeeId })

    if (likeError && likeError.code !== '23505') {
      throw likeError
    }

    // Check for mutual like
    const { data: mutual } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', likeeId)
      .eq('likee_id', user.id)
      .maybeSingle()

    let isMatch = false
    let conversationId: string | null = null

    if (mutual) {
      // Create match
      const { data: match } = await supabase
        .from('matches')
        .upsert(
          { user1_id: user.id, user2_id: likeeId },
          { onConflict: 'user1_id,user2_id' }
        )
        .select('id')
        .single()

      isMatch = true

      // Create conversation for the match if one doesn't exist
      if (match?.id) {
        const { data: existingConvo } = await supabase
          .from('conversations')
          .select('id')
          .eq('match_id', match.id)
          .maybeSingle()

        if (!existingConvo) {
          const { data: newConvo } = await supabase
            .from('conversations')
            .insert({ match_id: match.id })
            .select('id')
            .single()
          conversationId = newConvo?.id ?? null
        } else {
          conversationId = existingConvo.id
        }
      }

      // Fire match notifications for both users (non-blocking)
      notifyMatch(
        user.id,
        likeeId,
        likerProfile.full_name,
        likeeProfile.full_name,
      ).catch(err => console.error('[notifyMatch] failed:', err))

    } else {
      // Not a match yet — notify the likee (non-blocking)
      const likerPhotoUrl = Array.isArray(likerProfile.photos) && likerProfile.photos.length > 0
        ? (likerProfile.photos[0] as any)?.url ?? null
        : null

      notifyLike(
        likeeId,
        likerProfile.full_name,
        likerPhotoUrl,
        likeeProfile.tier ?? 'free',
      ).catch(err => console.error('[notifyLike] failed:', err))
    }

    return NextResponse.json({
      success: true,
      isMatch,
      conversationId,
      matchedProfile: isMatch ? {
        full_name: likeeProfile.full_name,
        photos:    likeeProfile.photos,
      } : null,
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/likes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}