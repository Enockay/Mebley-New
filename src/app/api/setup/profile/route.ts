import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

type SetupPayload = {
  username?: string
  full_name?: string
  age_range?: string
  gender?: string
  gender_preference?: string[]
  looking_for?: string[]
  bio?: string
  location?: string
  nationality?: string
  interests?: string[]
  photos?: Array<{ url: string; slot?: number; s3Key?: string }>
  profile_completeness?: number
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = (await request.json()) as SetupPayload
    const fullName = (body.full_name ?? '').trim()
    const interests = Array.isArray(body.interests) ? body.interests : []

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    if (interests.length < 1) {
      return NextResponse.json({ error: 'At least one interest is required' }, { status: 400 })
    }

    const username = (body.username ?? '').trim()
    const ageRange = body.age_range ?? null
    const gender = body.gender ?? null
    const genderPreference = Array.isArray(body.gender_preference) ? body.gender_preference : []
    const lookingFor = Array.isArray(body.looking_for) ? body.looking_for : []
    const bio = (body.bio ?? '').trim()
    const location = (body.location ?? '').trim() || null
    const nationality = (body.nationality ?? '').trim() || null
    const photosJson = JSON.stringify(Array.isArray(body.photos) ? body.photos : [])
    const completeness = Number.isFinite(body.profile_completeness)
      ? Math.max(0, Math.min(100, Number(body.profile_completeness)))
      : 10

    const updated = await pgQuery(
      `
      UPDATE profiles
      SET
        username = COALESCE(NULLIF($1, ''), username),
        full_name = $2,
        age_range = $3,
        gender = $4,
        gender_preference = $5::text[],
        looking_for = $6::text[],
        bio = $7,
        location = $8,
        nationality = $9,
        interests = $10::text[],
        photos = ARRAY(SELECT jsonb_array_elements($11::jsonb)),
        is_active = true,
        visible = true,
        profile_completeness = $12,
        updated_at = now()
      WHERE id = $13
      `,
      [
        username,
        fullName,
        ageRange,
        gender,
        genderPreference,
        lookingFor,
        bio,
        location,
        nationality,
        interests,
        photosJson,
        completeness,
        user.id,
      ]
    )

    // Legacy users can have an auth session without a matching profiles row.
    if ((updated.rowCount ?? 0) === 0) {
      await pgQuery(
        `
        INSERT INTO profiles (
          id, username, full_name, age_range, gender, gender_preference, looking_for,
          bio, location, nationality, interests, photos, is_active, visible,
          profile_completeness, tier, "plan", created_at, updated_at
        )
        VALUES (
          $1, COALESCE(NULLIF($2, ''), $3), $4, $5, COALESCE($6, ''), $7::text[], $8::text[],
          $9, $10, $11, $12::text[], ARRAY(SELECT jsonb_array_elements($13::jsonb)),
          true, true, $14, 'free', 'free', now(), now()
        )
        ON CONFLICT (id) DO UPDATE
        SET
          username = COALESCE(NULLIF(EXCLUDED.username, ''), profiles.username),
          full_name = EXCLUDED.full_name,
          age_range = EXCLUDED.age_range,
          gender = EXCLUDED.gender,
          gender_preference = EXCLUDED.gender_preference,
          looking_for = EXCLUDED.looking_for,
          bio = EXCLUDED.bio,
          location = EXCLUDED.location,
          nationality = EXCLUDED.nationality,
          interests = EXCLUDED.interests,
          photos = EXCLUDED.photos,
          is_active = true,
          visible = true,
          profile_completeness = EXCLUDED.profile_completeness,
          updated_at = now()
        `,
        [
          user.id,
          username,
          `user_${user.id.replace(/-/g, '').slice(0, 10)}`,
          fullName,
          ageRange,
          gender,
          genderPreference,
          lookingFor,
          bio,
          location,
          nationality,
          interests,
          photosJson,
          completeness,
        ]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[setup/profile] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
