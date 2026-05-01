import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
    sitemap: 'https://mebley.com/sitemap.xml',
    host: 'https://mebley.com',
  }
}
