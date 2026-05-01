// src/app/layout.tsx
'use client'

import './globals.css'
import { Suspense } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { OneSignalProvider } from '@/contexts/OneSignalContext'
import NavWrapper from '@/components/UI/NavWrapper'
import PushPermissionPrompt from '@/components/UI/PushPermissionPrompt'
import PaywallModal from '@/components/Paystack/PaywallModal'
import { usePaywall } from '@/hooks/usePaywall'
import { useAuth } from '@/contexts/AuthContext'

// Separate client component so we can call hooks
function AppShell({ children }: { children: React.ReactNode }) {
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

      {/* Global paywall — renders above everything */}
      <PaywallModal
        open={open}
        trigger={trigger}
        defaultTab={defaultTab}
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
      <head>
        <title>Mebley | Modern Connections</title>
        <meta
          name="description"
          content="Mebley is a modern dating experience built for depth, voice-first chemistry, and intentional connections across 40+ countries."
        />
        <meta
          name="keywords"
          content="Mebley, dating app, modern connections, intentional dating, voice notes, relationships, global dating"
        />
        <meta name="author" content="Mebley" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#1f0b12" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Mebley" />
        <meta property="og:title" content="Mebley | Modern Connections" />
        <meta
          property="og:description"
          content="Dating built for people who want something real. Intentional matches, voice-first chemistry, and meaningful conversations."
        />
        <meta property="og:image" content="/icon.svg" />
        <meta property="og:url" content="https://mebley.com" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mebley | Modern Connections" />
        <meta
          name="twitter:description"
          content="Mebley helps ambitious people build real relationships through thoughtful profiles and intentional matching."
        />
        <meta name="twitter:image" content="/icon.svg" />

        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="canonical" href="https://mebley.com" />
      </head>
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