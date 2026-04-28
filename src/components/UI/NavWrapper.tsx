'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import BottomNav from '@/components/UI/BottomNav'
import TopHeader from '@/components/UI/TopHeader'

// Routes with no nav ever
const NO_NAV_ROUTES = ['/', '/auth', '/terms', '/privacy', '/about', '/blog', '/contact', '/upgrade']

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
          radial-gradient(ellipse 55% 40% at 10% 90%, rgba(240,56,104,0.13) 0%, transparent 65%),
          radial-gradient(ellipse 45% 55% at 90% 10%, rgba(110,40,190,0.11) 0%, transparent 65%),
          radial-gradient(ellipse 70% 50% at 50% 50%, rgba(20,14,50,0.5) 0%, transparent 80%),
          #0c0a1e
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
