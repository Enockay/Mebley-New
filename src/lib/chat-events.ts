import { EventEmitter } from 'events'

type ConversationMessageListener = (message: unknown) => void

const globalForChatEvents = globalThis as unknown as {
  __chatEventsEmitter?: EventEmitter
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
}

export function subscribeConversationMessages(
  conversationId: string,
  listener: ConversationMessageListener
) {
  const key = `conversation:${conversationId}`
  const emitter = getEmitter()
  emitter.on(key, listener)
  return () => emitter.off(key, listener)
}

