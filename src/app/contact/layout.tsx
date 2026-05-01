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
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
