'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Heart, Sparkles, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/discover', label: 'Discover', icon: Heart },
  { href: '/browse', label: 'Browse', icon: Sparkles },
  { href: '/matches', label: 'Chats', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="bg-white border-t border-gray-200 px-6 py-3 fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'text-pink-500' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon
                className="w-6 h-6"
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className="text-xs font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}