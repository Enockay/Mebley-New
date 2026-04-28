'use client'
// src/components/UI/PlanBadge.tsx
import { type PlanTier, TIER_COLOR, TIER_LABEL } from '@/hooks/usePlan'

interface Props {
  tier:    PlanTier
  size?:   'sm' | 'md'
  style?:  React.CSSProperties
}

const TIER_EMOJI: Record<PlanTier, string> = {
  free: '', starter: '🪨', premium: '✨', vip: '👑',
}

export default function PlanBadge({ tier, size = 'sm', style }: Props) {
  if (tier === 'free') return null

  const color = TIER_COLOR[tier]
  const label = TIER_LABEL[tier]
  const emoji = TIER_EMOJI[tier]

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          4,
      padding:      size === 'md' ? '4px 10px' : '2px 7px',
      borderRadius: 100,
      fontSize:     size === 'md' ? 12 : 10,
      fontWeight:   700,
      fontFamily:   "'DM Sans', sans-serif",
      letterSpacing: '0.02em',
      color,
      background:   `${color}18`,
      border:       `1px solid ${color}38`,
      lineHeight:   1,
      ...style,
    }}>
      {emoji && <span style={{ fontSize: size === 'md' ? 13 : 10 }}>{emoji}</span>}
      {label}
    </span>
  )
}
