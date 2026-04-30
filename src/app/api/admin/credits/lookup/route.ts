import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { pgQuery } from '@/lib/postgres'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (!q) {
      return NextResponse.json({ error: 'Missing q (email or user id)' }, { status: 400 })
    }

    type UserRow = {
      id: string
      email: string
      is_active: boolean
      full_name: string | null
      username: string | null
      balance: number | null
      lifetime_earned: number | null
      lifetime_spent: number | null
    }

    let userRes: Awaited<ReturnType<typeof pgQuery<UserRow>>>
    if (UUID_RE.test(q)) {
      userRes = await pgQuery<UserRow>(
        `
        SELECT
          au.id,
          au.email::text AS email,
          au.is_active,
          p.full_name,
          p.username,
          cw.balance,
          cw.lifetime_earned,
          cw.lifetime_spent
        FROM app_users au
        LEFT JOIN profiles p ON p.id = au.id
        LEFT JOIN credit_wallets cw ON cw.user_id = au.id
        WHERE au.id = $1::uuid
        LIMIT 1
        `,
        [q]
      )
    } else {
      userRes = await pgQuery<UserRow>(
        `
        SELECT
          au.id,
          au.email::text AS email,
          au.is_active,
          p.full_name,
          p.username,
          cw.balance,
          cw.lifetime_earned,
          cw.lifetime_spent
        FROM app_users au
        LEFT JOIN profiles p ON p.id = au.id
        LEFT JOIN credit_wallets cw ON cw.user_id = au.id
        WHERE LOWER(au.email) = LOWER($1)
        LIMIT 1
        `,
        [q]
      )
    }

    const user = userRes.rows[0]
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const txRes = await pgQuery<{
      id: string
      amount: number
      balance_after: number
      type: string
      reference_type: string | null
      description: string | null
      created_at: string
    }>(
      `
      SELECT id, amount, balance_after, type, reference_type, description, created_at
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 40
      `,
      [user.id]
    )

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        is_active: user.is_active,
        full_name: user.full_name,
        username: user.username,
      },
      wallet: {
        balance: user.balance ?? 0,
        lifetime_earned: user.lifetime_earned ?? 0,
        lifetime_spent: user.lifetime_spent ?? 0,
      },
      transactions: txRes.rows,
    })
  } catch (error) {
    console.error('[admin/credits/lookup]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
