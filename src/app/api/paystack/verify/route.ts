import { NextRequest, NextResponse } from 'next/server'
import { fulfillPaystackReference } from '@/lib/paystack-fulfillment'

// ─── GET — browser redirect back from Paystack ────────────────────────────
export async function GET(req: NextRequest) {
  const ref     = req.nextUrl.searchParams.get('ref')
  const appBase = process.env.NEXT_PUBLIC_APP_URL!

  if (!ref) return NextResponse.redirect(`${appBase}/upgrade?error=missing_ref`)

  try {
    const res  = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const data = await res.json()

    if (!data.status || data.data?.status !== 'success') {
      console.error('[paystack/verify GET] not success:', data)
      return NextResponse.redirect(`${appBase}/upgrade?error=payment_failed`)
    }

    const result = await fulfillPaystackReference(ref, data.data?.metadata)
    if (!result.ok) {
      console.error('[paystack/verify GET] fulfill failed:', result)
      return NextResponse.redirect(`${appBase}/upgrade?error=fulfillment_failed`)
    }

    return NextResponse.redirect(`${appBase}/upgrade?success=1&type=${result.type}`)

  } catch (err) {
    console.error('[paystack/verify GET]', err)
    return NextResponse.redirect(`${appBase}/upgrade?error=server_error`)
  }
}

// Webhook events are handled by /api/paystack/webhook — do not add a POST handler here.
