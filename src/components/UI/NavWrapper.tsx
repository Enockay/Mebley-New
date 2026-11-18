'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppFrame from '@/components/App/AppFrame'

// Routes with no nav ever
const NO_NAV_ROUTES = ['/', '/auth', '/terms', '/privacy', '/about', '/blog', '/contact', '/upgrade', '/pricing', '/safety', '/faq', '/studio', '/admin']

// Routes that only hide nav when profile is incomplete
const SETUP_ROUTES = ['/setup', '/browse', '/discover']

// Full-screen on mobile (no top bar): an open chat thread
const BARE_MOBILE = (pathname: string, params: URLSearchParams) =>
  pathname.startsWith('/matches') && params.has('conversation')

export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile, user, loading } = useAuth()
  const isEmbedded = searchParams.get('embedded') === '1'

  // Embedded pages render inside in-app drawers/iframes and must not inherit nav wrapper spacing.
  if (isEmbedded) return <>{children}</>

  // Always no nav on these pages
  if (NO_NAV_ROUTES.some(r => pathname === r || (r !== '/' && pathname.startsWith(r)))) {
    return <>{children}</>
  }

  // Hide nav while user exists but hasn't completed profile setup
  const isSettingUp = !loading && user && (!profile || !(profile.interests as string[])?.length)
  if (SETUP_ROUTES.some(r => pathname.startsWith(r)) && isSettingUp) {
    return <div className="min-h-screen">{children}</div>
  }

  return <AppFrame bareMobile={BARE_MOBILE(pathname, searchParams)}>{children}</AppFrame>
}
