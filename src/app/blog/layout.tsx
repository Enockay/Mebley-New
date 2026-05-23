import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Dating advice, app features, success stories, and relationship insights from the Mebley team. Learn how to find intentional connections.',
  alternates: { canonical: 'https://mebley.com/blog' },
  openGraph: {
    title: 'Mebley Blog — Dating Insights & Stories',
    description: 'Voice notes, intent matching, global dating and more. Stories and advice from the Mebley community.',
    url: 'https://mebley.com/blog',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Mebley Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mebley Blog — Dating Insights & Stories',
    description: 'Voice notes, intent matching, global dating and more. Stories and advice from the Mebley community.',
    images: ['/opengraph-image'],
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
