// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { OneSignalProvider } from '@/contexts/OneSignalContext'
import AppShell from '@/components/UI/AppShell'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1f0b12',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://mebley.com'),
  title: {
    default: 'Mebley — Modern Connections',
    template: '%s | Mebley',
  },
  description:
    'Mebley is a voice-first dating app built for intentional connections across 40+ countries. Match by values, hear their voice before you meet, and find love that lasts.',
  keywords: [
    'dating app', 'Mebley', 'modern connections', 'intentional dating',
    'voice notes', 'online dating', 'global dating', 'relationships',
    'meet people online', 'dating platform', 'meaningful connections',
  ],
  authors: [{ name: 'Mebley', url: 'https://mebley.com' }],
  creator: 'Mebley',
  publisher: 'Mebley',
  category: 'dating',
  alternates: {
    canonical: 'https://mebley.com',
  },
  openGraph: {
    type: 'website',
    siteName: 'Mebley',
    title: 'Mebley — Modern Connections',
    description:
      'Dating built for people who want something real. Intentional matches, voice-first chemistry, and meaningful conversations across 40+ countries.',
    url: 'https://mebley.com',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Mebley — Modern Connections dating app',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mebley',
    creator: '@mebley',
    title: 'Mebley — Modern Connections',
    description:
      'Mebley helps ambitious people build real relationships through voice notes, intentional profiles, and values-based matching.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_TOKEN',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <OneSignalProvider>
            <AppShell>{children}</AppShell>
          </OneSignalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
