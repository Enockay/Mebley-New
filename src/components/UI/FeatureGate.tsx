'use client'
// src/components/UI/FeatureGate.tsx
// Wraps a feature — renders children if unlocked, lock UI otherwise.
import { usePaywall } from '@/hooks/usePaywall'
import { usePlan, type PlanTier, TIER_COLOR, TIER_LABEL } from '@/hooks/usePlan'
import { Lock } from 'lucide-react'

interface Props {
  feature:  string                // key in FEATURE_TIER
  children: React.ReactNode
  // Optional: replace the default lock overlay with a custom fallback
  fallback?: React.ReactNode
  // If true, renders nothing instead of a lock overlay when gated
  silent?:  boolean
}

const ROSE = '#f03868'

export default function FeatureGate({ feature, children, fallback, silent }: Props) {
  const { can, requiresTier } = usePlan()
  const { openPaywall }       = usePaywall()

  if (can(feature)) return <>{children}</>

  if (silent) return null

  if (fallback) return <>{fallback}</>

  const requiredTier: PlanTier = requiresTier(feature) as PlanTier
  const color = TIER_COLOR[requiredTier] ?? ROSE
  const label = TIER_LABEL[requiredTier] ?? requiredTier

  return (
    <div
      onClick={() => openPaywall('general', 'plans')}
      style={{
        position:       'relative',
        cursor:         'pointer',
        userSelect:     'none',
      }}
    >
      {/* Blurred children preview */}
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', opacity: 0.5 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div style={{
        position:        'absolute',
        inset:           0,
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             8,
        background:      'rgba(8,6,20,0.72)',
        backdropFilter:  'blur(4px)',
        borderRadius:    'inherit',
      }}>
        <div style={{
          width:          40,
          height:         40,
          borderRadius:   '50%',
          background:     `${color}18`,
          border:         `1px solid ${color}38`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <Lock size={18} color={color} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#f0e8f4', margin: '0 0 3px', fontFamily: "'DM Sans', sans-serif" }}>
            {label} feature
          </p>
          <p style={{ fontSize: 11, color: 'rgba(240,232,244,0.5)', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Tap to upgrade
          </p>
        </div>
      </div>
    </div>
  )
}
