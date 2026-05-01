/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      full_name, bio, location, nationality,
      looking_for, interests, prompts, profile_completeness,
    } = body

    await pgQuery(
      `UPDATE profiles
       SET full_name            = COALESCE($1, full_name),
           bio                  = COALESCE($2, bio),
           location             = COALESCE($3, location),
           nationality          = COALESCE($4, nationality),
           looking_for          = COALESCE($5, looking_for),
           interests            = COALESCE($6, interests),
           prompts              = COALESCE($7, prompts),
           profile_completeness = COALESCE($8, profile_completeness),
           updated_at           = NOW()
       WHERE id = $9`,
      [
        full_name ?? null,
        bio ?? null,
        location ?? null,
        nationality ?? null,
        looking_for ? JSON.stringify(looking_for) : null,
        interests   ? JSON.stringify(interests)   : null,
        prompts     ? JSON.stringify(prompts)      : null,
        profile_completeness ?? null,
        user.id,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/profile error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
