'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import BottomNav from '@/components/UI/BottomNav'
import TopHeader from '@/components/UI/TopHeader'

// Routes with no nav ever
const NO_NAV_ROUTES = ['/', '/auth', '/terms', '/privacy']

// Routes that only hide nav when profile is incomplete
const SETUP_ROUTES = ['/setup', '/discover']

export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, user, loading } = useAuth()

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
    <div className="flex flex-col h-screen">
      <TopHeader />
      <main className="flex-1 overflow-y-auto mt-16 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
