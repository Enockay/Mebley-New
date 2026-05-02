import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const host = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/blog', '/contact', '/privacy', '/terms', '/upgrade'],
        disallow: [
          '/api/',
          '/admin/',
          '/browse',
          '/matches',
          '/profile',
          '/setup',
          '/discover',
          '/auth/callback',
          '/auth/reset-password',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  }
}
