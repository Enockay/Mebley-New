'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase-client'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MongoMessage {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  messageType: 'text' | 'image' | 'gif' | 'audio'
  isRead: boolean
  createdAt: string
}

interface ChatProps {
  conversationId: string
  otherProfile: Profile
  onBack: () => void
}

// ✅ Replaced calculateAge(date_of_birth) with age_range label
const AGE_RANGE_LABELS: Record<string, string> = {
  '18_24':  '18–24',
  '25_34':  '25–34',
  '35_40':  '35–40',
  '40_50':  '40–50',
  '50_65':  '50–65',
  '65_plus':'65+',
}

export default function Chat({ conversationId, otherProfile, onBack }: ChatProps) {
  const supabase = createClient()
  const { profile: currentProfile } = useAuth()
  const [messages, setMessages]     = useState<MongoMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/messages/${conversationId}`)
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch (err) {
      setError('Could not load messages. Please try again.')
      console.error('Load messages error:', err)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => { loadMessages() }, [loadMessages])

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'conversations', filter: `id=eq.${conversationId}`,
      }, async () => {
        try {
          const res = await fetch(`/api/messages/${conversationId}?limit=1`)
          if (!res.ok) return
          const data = await res.json()
          if (data.messages?.length > 0) {
            const latest = data.messages[0]
            setMessages(prev => {
              const exists = prev.some(m => m.id === latest.id)
              if (exists) return prev
              return [...prev, latest]
            })
          }
        } catch (err) {
          console.error('Realtime fetch error:', err)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  useEffect(() => { scrollToBottom() }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentProfile || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    const optimisticMsg: MongoMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId:    currentProfile.id,
      receiverId:  otherProfile.id,
      content,
      messageType: 'text',
      isRead:      false,
      createdAt:   new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType: 'text' }),
      })

      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        setNewMessage(content)
        throw new Error('Failed to send message')
      }

      const { message } = await res.json()
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...message } : m))
    } catch (err) {
      console.error('Send message error:', err)
      setError('Failed to send message. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  // ✅ Age display from age_range — no date_of_birth needed
  const ageLabel = AGE_RANGE_LABELS[(otherProfile as any).age_range ?? '']

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 128px)' }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {otherProfile.full_name}{ageLabel ? `, ${ageLabel}` : ''}
          </h3>
          {otherProfile.location && (
            <p className="text-sm text-gray-500">{otherProfile.location}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-gray-600">
                Start the conversation! Say hello to {otherProfile.full_name}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentProfile?.id
              return (
                <div key={message.id ?? index}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-pink-100' : 'text-gray-500'}`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={sending} />
          <button type="submit" disabled={!newMessage.trim() || sending}
            className="p-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  )
}
