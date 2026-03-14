'use client'
import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const OneSignalContext = createContext({})

export function OneSignalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (typeof window === 'undefined') return
    // OneSignal is initialised in OneSignalSDKWorker.js
    // Just set the external user id when user is available
    const win = window as any
    if (win.OneSignal) {
      win.OneSignal.push(() => {
        win.OneSignal.setExternalUserId(user.id)
      })
    }
  }, [user])

  return (
    <OneSignalContext.Provider value={{}}>
      {children}
    </OneSignalContext.Provider>
  )
}

export const useOneSignal = () => useContext(OneSignalContext)
