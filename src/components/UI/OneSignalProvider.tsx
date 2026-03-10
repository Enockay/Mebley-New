/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Donegal_One } from 'next/font/google'

export default function OneSignalProvider() {
  const { user } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return

    const initOneSignal = async () => {
      try {
        const OneSignal = (await import('react-onesignal')).default

        await OneSignal.init({
          appId:                        process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam:           { scope: '/' },
          notifyButton: { enable: false } as any,
          promptOptions: {
            slidedown: {
              prompts: [
                {
                    type: 'push',
                    autoPrompt: false,
                    delay: {
                        pageViews: undefined,
                        timeDelay: undefined
                    }
                },
              ],
            },
          },
        })

        // If user is logged in, set their external ID so we can
        // target them by user ID rather than device ID
        if (user?.id) {
          await OneSignal.login(user.id)
        }

        // Listen for when user grants permission
        OneSignal.Notifications.addEventListener(
          'permissionChange',
          async (granted: boolean) => {
            if (!granted) return

            // Give OneSignal a moment to register the subscription
            await new Promise(res => setTimeout(res, 1500))

            try {
              const subscription = await OneSignal.User.PushSubscription
              const playerId     = subscription?.id

              if (playerId) {
                await fetch('/api/push/subscribe', {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({ playerId, platform: 'web' }),
                })
              }
            } catch (err) {
              console.error('[OneSignal] failed to save subscription:', err)
            }
          }
        )

        // If already subscribed, make sure player ID is saved
        const isSubscribed = OneSignal.Notifications.permission
        if (isSubscribed && user?.id) {
          const subscription = OneSignal.User.PushSubscription
          const playerId     = subscription?.id

          if (playerId) {
            await fetch('/api/push/subscribe', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ playerId, platform: 'web' }),
            }).catch(() => {})
          }
        }

      } catch (err) {
        console.error('[OneSignal] init error:', err)
      }
    }

    initOneSignal()
  }, [user?.id])

  // Renders nothing — purely side-effect provider
  return null
}
