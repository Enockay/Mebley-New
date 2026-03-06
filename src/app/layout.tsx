import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import BottomNav from '@/components/UI/BottomNav'
import TopHeader from '@/components/UI/TopHeader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Crotchet',
  description: 'Find your perfect match globally',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col h-screen">
            <TopHeader />
            <main className="flex-1 overflow-hidden mt-16 mb-16">
              {children}
            </main>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}