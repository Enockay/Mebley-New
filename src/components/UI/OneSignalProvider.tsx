/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

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
          notifyButton:                 { enable: false } as any,
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

        // Set external user ID so OneSignal can target by Supabase user ID
        if (user?.id) {
          await OneSignal.login(user.id)
        }

        // Helper — polls for player ID up to 10 times with 1s delay
        const getPlayerIdWithRetry = async (): Promise<string | null> => {
          for (let i = 0; i < 10; i++) {
            const playerId = OneSignal.User.PushSubscription.id
            if (playerId) return playerId
            await new Promise(res => setTimeout(res, 1000))
          }
          return null
        }

        // Save player ID to Supabase
        const savePlayerId = async () => {
          const playerId = await getPlayerIdWithRetry()
          if (!playerId) {
            console.warn('[OneSignal] no player ID after retries')
            return
          }
          try {
            await fetch('/api/push/subscribe', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ playerId, platform: 'web' }),
            })
            console.log('[OneSignal] player ID saved:', playerId)
          } catch (err) {
            console.error('[OneSignal] failed to save player ID:', err)
          }
        }

        // Listen for permission being granted
        OneSignal.Notifications.addEventListener(
          'permissionChange',
          async (granted: boolean) => {
            if (!granted) return
            await savePlayerId()
          }
        )

        // If already subscribed, ensure player ID is saved
        const alreadySubscribed = OneSignal.Notifications.permission
        if (alreadySubscribed) {
          await savePlayerId()
        }

      } catch (err) {
        console.error('[OneSignal] init error:', err)
      }
    }

    initOneSignal()
  }, [user?.id])

  return null
}