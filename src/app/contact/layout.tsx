import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    "Get in touch with the Mebley team. Support, press enquiries, partnerships, and feedback — we'd love to hear from you.",
  alternates: { canonical: 'https://mebley.com/contact' },
  openGraph: {
    title: 'Contact Mebley',
    description: 'Reach our support team for help with your account, billing, safety, or partnership enquiries.',
    url: 'https://mebley.com/contact',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Contact Mebley' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Mebley',
    description: "Support, press enquiries, partnerships, and feedback — we'd love to hear from you.",
    images: ['/opengraph-image'],
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
