import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upgrade to Premium',
  description:
    'Unlock unlimited Stitches, see who liked you, Spotlight boosts, and priority matching on Mebley. Choose the plan that fits your dating journey.',
  alternates: { canonical: 'https://mebley.com/upgrade' },
  openGraph: {
    title: 'Mebley Premium — Upgrade Your Dating',
    description:
      'Get unlimited Stitches, see everyone who liked you, and boost your visibility. Premium plans starting from just a few dollars a month.',
    url: 'https://mebley.com/upgrade',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Mebley Premium' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mebley Premium — Upgrade Your Dating',
    description: 'Unlimited Stitches, see who liked you, Spotlight boosts and more.',
    images: ['/opengraph-image'],
  },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
