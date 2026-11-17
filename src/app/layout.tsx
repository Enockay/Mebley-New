// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { OneSignalProvider } from '@/contexts/OneSignalContext'
import AppShell from '@/components/UI/AppShell'
import { getSiteUrl } from '@/lib/site-url'
import { SITE_FACTS } from '@/lib/site-facts'
import '@/components/Marketing/marketing.css'

const siteUrl = getSiteUrl()

/**
 * Loaded with <link> rather than CSS @import, which the build pipeline drops
 * (fonts were silently falling back to system serif/sans before).
 * Fraunces keeps its optical-size axis for display sizes (review 4.3).
 */
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800' +
  '&family=Inter:wght@400..700&family=DM+Sans:wght@300;400;500;600;700&display=swap'
const siteName = 'Mebley'

/** Aligned with visible landing copy so Google is less likely to substitute other snippet text. */
const siteTitle = 'Mebley: Voice First Dating App for Real Connections'
const siteDescription =
  "Hear someone's voice before you match. Send a Stitch, a like with a personal note, and meet people ranked by shared values. Free to join, selfie verified, 18+."

/**
 * One Organization/WebSite graph for every page. Social links come from
 * SITE_FACTS so they always match the footer (review issue S1).
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: siteName,
      legalName: SITE_FACTS.legalName,
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/icons/icon-512.png`, width: 512, height: 512 },
      sameAs: SITE_FACTS.social.map(s => s.href),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${siteUrl}/contact`,
        availableLanguage: 'English',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en-US',
    },
  ],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0C0A1E',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: '%s | Mebley',
  },
  description: siteDescription,
  keywords: [
    'dating app', 'Mebley', 'voice dating', 'voice first dating app', 'intentional dating',
    'voice notes', 'online dating', 'global dating', 'relationships',
    'meet people online', 'dating platform', 'meaningful connections',
  ],
  authors: [{ name: 'Mebley', url: siteUrl }],
  creator: 'Mebley',
  publisher: 'Mebley',
  category: 'dating',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Mebley, voice first dating',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Mebley_Dating',
    creator: '@Mebley_Dating',
    title: siteTitle,
    description: siteDescription,
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
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: [{ url: '/icons/icon-32.png', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS_HREF} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <OneSignalProvider>
            <AppShell>{children}</AppShell>
          </OneSignalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
