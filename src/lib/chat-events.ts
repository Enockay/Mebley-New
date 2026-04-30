import { EventEmitter } from 'events'
import { Client } from 'pg'
import { randomUUID } from 'crypto'

type ConversationMessageListener = (message: unknown) => void
const CHANNEL_NAME = 'conversation_messages'
const INSTANCE_ID = randomUUID()

const globalForChatEvents = globalThis as unknown as {
  __chatEventsEmitter?: EventEmitter
  __chatEventsListenerStarted?: boolean
  __chatEventsPgClient?: Client
}

function resolveSslConfig(cs: string): false | { rejectUnauthorized: false } {
  const explicit = process.env.DATABASE_SSL?.toLowerCase().trim()
  if (explicit === 'true' || explicit === 'require') return { rejectUnauthorized: false }
  if (explicit === 'false' || explicit === 'disable') return false

  let host = ''
  try {
    host = new URL(cs).hostname.toLowerCase()
  } catch {
    host = ''
  }
  const managedSslHosts = ['supabase.co', 'neon.tech', 'render.com', 'railway.app', 'amazonaws.com']
  return managedSslHosts.some((suffix) => host.endsWith(suffix)) ? { rejectUnauthorized: false } : false
}

function getEmitter(): EventEmitter {
  if (!globalForChatEvents.__chatEventsEmitter) {
    globalForChatEvents.__chatEventsEmitter = new EventEmitter()
    globalForChatEvents.__chatEventsEmitter.setMaxListeners(200)
  }
  return globalForChatEvents.__chatEventsEmitter
}

export function emitConversationMessage(conversationId: string, message: unknown) {
  getEmitter().emit(`conversation:${conversationId}`, message)
  void broadcastDistributedEvent(conversationId, message)
}

export function subscribeConversationMessages(
  conversationId: string,
  listener: ConversationMessageListener
) {
  ensureDistributedListener()
  const key = `conversation:${conversationId}`
  const emitter = getEmitter()
  emitter.on(key, listener)
  return () => emitter.off(key, listener)
}

async function broadcastDistributedEvent(conversationId: string, message: unknown) {
  const cs = process.env.DATABASE_URL
  if (!cs) return

  const payload = JSON.stringify({ conversationId, message, source: INSTANCE_ID })
  const client = new Client({ connectionString: cs, ssl: resolveSslConfig(cs) })
  try {
    await client.connect()
    await client.query('SELECT pg_notify($1, $2)', [CHANNEL_NAME, payload])
  } catch (error) {
    console.error('[chat-events] distributed emit failed:', error)
  } finally {
    await client.end().catch(() => null)
  }
}

function ensureDistributedListener() {
  if (globalForChatEvents.__chatEventsListenerStarted) return
  const cs = process.env.DATABASE_URL
  if (!cs) return

  globalForChatEvents.__chatEventsListenerStarted = true
  const client = new Client({ connectionString: cs, ssl: resolveSslConfig(cs) })
  globalForChatEvents.__chatEventsPgClient = client

  client.on('notification', (msg) => {
    if (msg.channel !== CHANNEL_NAME || !msg.payload) return
    try {
      const parsed = JSON.parse(msg.payload) as { conversationId?: string; message?: unknown; source?: string }
      if (!parsed.conversationId) return
      if (parsed.source === INSTANCE_ID) return
      getEmitter().emit(`conversation:${parsed.conversationId}`, parsed.message)
    } catch {
      // Ignore malformed pub/sub payloads
    }
  })

  client.on('error', (error) => {
    console.error('[chat-events] distributed listener error:', error)
    globalForChatEvents.__chatEventsListenerStarted = false
  })

  void client.connect()
    .then(() => client.query(`LISTEN ${CHANNEL_NAME}`))
    .catch((error) => {
      console.error('[chat-events] failed to start distributed listener:', error)
      globalForChatEvents.__chatEventsListenerStarted = false
    })
}

