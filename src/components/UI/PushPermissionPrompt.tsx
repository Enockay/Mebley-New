'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

export default function PushPermissionPrompt() {
  const [show, setShow]       = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already granted, denied, or dismissed this session
    if (typeof window === 'undefined') return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return
    if (sessionStorage.getItem('push_prompt_dismissed')) return

    // Show after 3 seconds — give the page time to load
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleEnable = async () => {
    try {
      const OneSignal = (await import('react-onesignal')).default
      await OneSignal.Notifications.requestPermission()
      setShow(false)
    } catch (err) {
      console.error('[PushPrompt] failed to request permission:', err)
      setShow(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('push_prompt_dismissed', '1')
    setDismissed(true)
    setShow(false)
  }

  if (!show || dismissed) return null

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
