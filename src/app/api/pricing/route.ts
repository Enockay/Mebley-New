/**
 * GET /api/pricing: the regional prices checkout will charge this visitor
 * (review 4.12, PR-04). Used by the in-app plan and credit screens so they show
 * the same figure as the public Pricing page and checkout.
 */
import { NextRequest, NextResponse } from 'next/server'
import { countryFromHeaders } from '@/lib/pricing-server'
import { regionPricing } from '@/lib/pricing'

export async function GET(req: NextRequest) {
  const pricing = regionPricing(countryFromHeaders(req.headers))
  return NextResponse.json(pricing, { headers: { 'Cache-Control': 'private, no-store', Vary: '*' } })
}
