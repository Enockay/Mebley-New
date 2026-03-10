import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import NavWrapper from '@/components/UI/NavWrapper'
import OneSignalProvider from '@/components/UI/OneSignalProvider'
import PushPermissionPrompt from '@/components/UI/PushPermissionPrompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Crotchet',
  description: 'Find your perfect match globally',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <OneSignalProvider />
          <NavWrapper>
            {children}
          </NavWrapper>
          <PushPermissionPrompt />
        </AuthProvider>
      </body>
    </html>
  )
}
