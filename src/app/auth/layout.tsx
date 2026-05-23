import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In or Join Free',
  description:
    'Create your free Mebley account or sign in. Voice-first dating for intentional connections across 40+ countries. Join 12k+ members today.',
  keywords: ['mebley login', 'mebley sign up', 'dating app sign in', 'join mebley', 'create dating profile'],
  alternates: { canonical: 'https://mebley.com/auth' },
  openGraph: {
    title: 'Join Mebley Free — Sign In or Create Account',
    description: 'Start your Mebley journey. Build a voice-first profile, send intentional Stitches, and meet people who match your depth.',
    url: 'https://mebley.com/auth',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Mebley — Join Free' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join Mebley Free',
    description: 'Voice-first dating for intentional connections. Create your profile in minutes.',
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
