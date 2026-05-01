// src/lib/notifications.ts
// Server-only — never import this in client components

import { pgQuery } from '@/lib/postgres'

const ONESIGNAL_APP_ID  = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY!
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications'

interface NotificationPayload {
  headings:           { en: string }
  contents:           { en: string }
  include_player_ids: string[]
  url?:               string
  chrome_web_icon?:   string
  data?:              Record<string, string>
}

async function getPlayerIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return []
  const res = await pgQuery<{ onesignal_player_id: string }>(
    `SELECT onesignal_player_id FROM push_subscriptions WHERE user_id = ANY($1)`,
    [userIds]
  )
  return res.rows.map(r => r.onesignal_player_id)
}

async function sendNotification(payload: NotificationPayload): Promise<void> {
  if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) return
  if (payload.include_player_ids.length === 0) return

  try {
    const res = await fetch(ONESIGNAL_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({ app_id: ONESIGNAL_APP_ID, ...payload }),
    })
    if (!res.ok) console.error('[OneSignal] send failed:', await res.json())
  } catch (err) {
    console.error('[OneSignal] network error:', err)
  }
}

export async function notifyMatch(
  userId1: string, userId2: string, name1: string, name2: string,
): Promise<void> {
  const [players1, players2] = await Promise.all([
    getPlayerIds([userId1]),
    getPlayerIds([userId2]),
  ])
  await Promise.all([
    players1.length > 0 && sendNotification({
      headings:           { en: "It's a match! 🎉" },
      contents:           { en: `You and ${name2} liked each other` },
      include_player_ids: players1,
      url:                '/matches',
      data:               { type: 'match', matchedUserId: userId2 },
    }),
    players2.length > 0 && sendNotification({
      headings:           { en: "It's a match! 🎉" },
      contents:           { en: `You and ${name1} liked each other` },
      include_player_ids: players2,
      url:                '/matches',
      data:               { type: 'match', matchedUserId: userId1 },
    }),
  ])
}

export async function notifyMessage(
  receiverId:     string,
  senderName:     string,
  messagePreview: string,
  conversationId: string,
): Promise<void> {
  const playerIds = await getPlayerIds([receiverId])
  if (playerIds.length === 0) return

  const preview = messagePreview.length > 60 ? messagePreview.slice(0, 57) + '...' : messagePreview

  await sendNotification({
    headings:           { en: `${senderName} sent you a message 💬` },
    contents:           { en: preview },
    include_player_ids: playerIds,
    url:                `/messages/${conversationId}`,
    data:               { type: 'message', conversationId },
  })
}

export async function notifyLike(
  receiverId:    string,
  likerName:     string,
  likerPhotoUrl: string | null,
  receiverTier:  string,
): Promise<void> {
  const playerIds = await getPlayerIds([receiverId])
  if (playerIds.length === 0) return

  const isPremium = receiverTier === 'premium' || receiverTier === 'vip'
  await sendNotification({
    headings:           { en: isPremium ? `${likerName} liked you ❤️` : 'Someone liked you ❤️' },
    contents:           { en: isPremium ? `${likerName} is interested in you — go say hi!` : 'Upgrade to see who liked you' },
    include_player_ids: playerIds,
    url:                isPremium ? '/likes' : '/upgrade',
    chrome_web_icon:    isPremium && likerPhotoUrl ? likerPhotoUrl : undefined,
    data:               { type: 'like', revealed: String(isPremium) },
  })
}

export async function notifyIncomingCall(
  receiverId:     string,
  callerName:     string,
  conversationId: string,
): Promise<void> {
  const playerIds = await getPlayerIds([receiverId])
  if (playerIds.length === 0) return

  await sendNotification({
    headings:           { en: '📹 Incoming video call' },
    contents:           { en: `${callerName} is calling you` },
    include_player_ids: playerIds,
    url:                '/matches',
    data:               { type: 'video_call', conversationId },
  })
}
