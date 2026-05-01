'use client'

import { Suspense } from 'react'
import { usePaywall } from '@/hooks/usePaywall'
import { useAuth } from '@/contexts/AuthContext'
import NavWrapper from '@/components/UI/NavWrapper'
import PushPermissionPrompt from '@/components/UI/PushPermissionPrompt'
import PaywallModal from '@/components/Paystack/PaywallModal'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { open, trigger, defaultTab, closePaywall } = usePaywall()
  const { refreshProfile } = useAuth()

  return (
    <>
      <Suspense fallback={<>{children}</>}>
        <NavWrapper>
          <PushPermissionPrompt />
          {children}
        </NavWrapper>
      </Suspense>

      <PaywallModal
        open={open}
        trigger={trigger}
        defaultTab={defaultTab}
        onClose={closePaywall}
        onSpendCredits={async (product, cost) => {
          const isBoost = ['quick', 'day', 'weekend', 'power'].includes(product)
          const res = await fetch('/api/credits/spend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product, type: isBoost ? 'boost' : 'moment' }),
          })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Failed')
          }
          await refreshProfile()
        }}
      />
    </>
  )
}
