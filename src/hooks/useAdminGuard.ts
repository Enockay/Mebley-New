'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAdminGuard() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace('/auth')
    }
  }, [user, isAdmin, loading, router])

  return { loading, authorized: !loading && !!user && isAdmin }
}
