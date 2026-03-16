/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// ─── storage keys ───────────────────────────────────────────────────────────
const KEY_ACCEPTED       = 'push_accepted'       // 'true' once user grants
const KEY_LAST_DISMISSED = 'push_last_dismissed' // ISO timestamp of last dismiss
const DISMISS_COOLDOWN   = 24 * 60 * 60 * 1000  // 24 hours in ms

// ─── blocked paths — prompt never appears here ──────────────────────────────
const BLOCKED: string[] = ['/', '/auth', '/setup', '/terms', '/privacy']

// ─── profile complete — mirrors NavWrapper logic ────────────────────────────
function profileComplete(profile: any): boolean {
  if (!profile) return false
  const interests = profile.interests as string[] | null
  return Array.isArray(interests) && interests.length > 0
}

// ─── should we show right now? ───────────────────────────────────────────────
function shouldShow(): boolean {
  // Permanently accepted — never ask again
  if (localStorage.getItem(KEY_ACCEPTED) === 'true') return false

  // Browser-level permission already resolved
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') {
      localStorage.setItem(KEY_ACCEPTED, 'true')
      return false
    }
    if (Notification.permission === 'denied') return false
  }

  // Dismissed recently — wait 24h before asking again
  const raw = localStorage.getItem(KEY_LAST_DISMISSED)
  if (raw) {
    const elapsed = Date.now() - new Date(raw).getTime()
    if (elapsed < DISMISS_COOLDOWN) return false
  }

  return true
}

export default function PushPermissionPrompt() {
  const [show, setShow]            = useState(false)
  const { user, profile, loading } = useAuth()
  const pathname                   = usePathname()

  // Attempt to show — only when tab is active (covers "notify only while using app")
  const tryShow = useCallback(() => {
    if (document.visibilityState !== 'visible') return
    if (shouldShow()) setShow(true)
  }, [])

  useEffect(() => {
    // Never show on blocked paths
    const blocked = BLOCKED.some(p =>
      pathname === p || (p !== '/' && pathname?.startsWith(p))
    )
    if (blocked) return

    // Wait for auth to resolve
    if (loading) return

    // Must be logged in AND have a complete profile
    if (!user || !profileComplete(profile)) return

    // Show after 4s — give page time to settle
    const t = setTimeout(tryShow, 4000)

    // Re-check when user switches back to the tab
    document.addEventListener('visibilitychange', tryShow)

    return () => {
      clearTimeout(t)
      document.removeEventListener('visibilitychange', tryShow)
    }
  }, [user, profile, loading, pathname, tryShow])

  // ─── handlers ──────────────────────────────────────────────────────────────

  const handleEnable = async () => {
    setShow(false)
    localStorage.setItem(KEY_ACCEPTED, 'true')
    try {
      const OneSignal = (await import('react-onesignal')).default
      await OneSignal.Notifications.requestPermission()
    }   catch (err) {
      console.error('[PushPrompt]', err)
    }
  }

  const handleDismiss = () => {
    // "Not now" — come back in 24h
    localStorage.setItem(KEY_LAST_DISMISSED, new Date().toISOString())
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Bell size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Never miss a match</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Get notified when someone likes you or sends a message.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all">
              Enable notifications
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 border border-gray-200 text-gray-500 text-xs rounded-xl hover:bg-gray-50 transition-all">
              Not now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
          <X size={16} />
        </button>

      </div>
    </div>
  )
}
