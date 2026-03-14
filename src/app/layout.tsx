// src/app/layout.tsx
'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { OneSignalProvider } from '@/contexts/OneSignalContext'
import NavWrapper from '@/components/UI/NavWrapper'
import PushPermissionPrompt from '@/components/UI/PushPermissionPrompt'
import PaywallModal from '@/components/Paystack/PaywallModal'
import { usePaywall } from '@/hooks/usePaywall'
import { useAuth } from '@/contexts/AuthContext'

// Separate client component so we can call hooks
function AppShell({ children }: { children: React.ReactNode }) {
  const { open, trigger, closePaywall } = usePaywall()
  const { refreshProfile } = useAuth()

  return (
    <>
      <NavWrapper>
        <PushPermissionPrompt />
        {children}
      </NavWrapper>

      {/* Global paywall — renders above everything */}
      <PaywallModal
        open={open}
        trigger={trigger}
        onClose={closePaywall}
        onSpendCredits={async (product, cost) => {
          const isBoost = ['quick','day','weekend','power'].includes(product)
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <OneSignalProvider>
            <AppShell>{children}</AppShell>
          </OneSignalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}