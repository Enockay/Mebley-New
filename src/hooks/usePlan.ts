// src/hooks/usePlan.ts
import { useAuth } from '@/contexts/AuthContext'
import { usePaywall } from '@/hooks/usePaywall'

export type PlanTier = 'free' | 'starter' | 'premium' | 'vip'

export const TIER_RANK: Record<PlanTier, number> = {
  free: 0, starter: 1, premium: 2, vip: 3,
}

export const TIER_LABEL: Record<PlanTier, string> = {
  free: 'Free', starter: 'Starter', premium: 'Premium', vip: 'VIP',
}

export const TIER_COLOR: Record<PlanTier, string> = {
  free:    'rgba(255,255,255,0.35)',
  starter: '#a78bfa',
  premium: '#f03868',
  vip:     '#fbbf24',
}

// Minimum tier required for each feature
export const FEATURE_TIER: Record<string, PlanTier> = {
  spend_credits:     'starter',
  who_liked_you:     'premium',
  read_receipts:     'premium',
  advanced_filters:  'premium',
  priority_discover: 'premium',
  vip_badge:         'vip',
  day_boost_monthly: 'vip',
}

export function usePlan() {
  const { profile, creditBalance } = useAuth()
  const { openPaywall } = usePaywall()

  const tier  = (((profile as any)?.plan as PlanTier) ?? 'free')
  const rank  = TIER_RANK[tier] ?? 0

  function can(feature: string): boolean {
    const required = FEATURE_TIER[feature]
    if (!required) return true
    return rank >= TIER_RANK[required]
  }

  function requiresTier(feature: string): PlanTier {
    return FEATURE_TIER[feature] ?? 'free'
  }

  function gate(feature: string): boolean {
    if (can(feature)) return true
    openPaywall('general', 'plans')
    return false
  }

  const planExpires: string | null = (profile as any)?.plan_expires ?? null
  const isExpired = planExpires ? new Date(planExpires) < new Date() : false
  const effectiveTier: PlanTier = isExpired && tier !== 'free' ? 'free' : tier

  return {
    tier:    effectiveTier,
    rank:    TIER_RANK[effectiveTier] ?? 0,
    can,
    requiresTier,
    gate,
    creditBalance: Math.max(0, Number(creditBalance ?? 0)),
    planExpires,
    isExpired,
    isFree:    effectiveTier === 'free',
    isStarter: effectiveTier === 'starter',
    isPremium: effectiveTier === 'premium',
    isVip:     effectiveTier === 'vip',
    isPaid:    effectiveTier !== 'free',
  }
}
