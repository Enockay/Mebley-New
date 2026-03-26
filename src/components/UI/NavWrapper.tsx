'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import BottomNav from '@/components/UI/BottomNav'
import TopHeader from '@/components/UI/TopHeader'

// Routes with no nav ever
const NO_NAV_ROUTES = ['/', '/auth', '/terms', '/privacy']

// Routes that only hide nav when profile is incomplete
const SETUP_ROUTES = ['/setup', '/browse', '/discover']

export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile, user, loading } = useAuth()
  const isEmbedded = searchParams.get('embedded') === '1'
  const hideTopHeaderOnRoute = pathname === '/matches' || pathname.startsWith('/matches/')

  // Embedded pages render inside in-app drawers/iframes and must not inherit nav wrapper spacing.
  if (isEmbedded) {
    return <>{children}</>
  }

  // Always no nav on these pages
  if (NO_NAV_ROUTES.some(r => pathname === r || (r !== '/' && pathname.startsWith(r)))) {
    return <>{children}</>
  }

  // Hide nav while user exists but hasn't completed profile setup
  const isSettingUp = !loading && user && (!profile || !(profile.interests as string[])?.length)
  if (SETUP_ROUTES.some(r => pathname.startsWith(r)) && isSettingUp) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div
      className="flex flex-col h-screen"
      style={{
        background: `
          radial-gradient(34% 46% at 22% 26%, rgba(174,16,127,0.26), transparent 72%),
          radial-gradient(38% 52% at 82% 12%, rgba(88,12,120,0.33), transparent 70%),
          linear-gradient(135deg, #120018 0%, #2b043f 48%, #70004b 78%, #d1005f 100%)
        `,
      }}
    >
      {!hideTopHeaderOnRoute && <TopHeader />}
      <main className={`flex-1 overflow-y-auto ${hideTopHeaderOnRoute ? 'mt-0 pb-0' : 'mt-16 pb-20'}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
