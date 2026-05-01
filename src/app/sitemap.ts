import type { MetadataRoute } from 'next'

const BASE = 'https://mebley.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/upgrade`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/voice-notes-change-dating`,
      lastModified: '2026-04-18T00:00:00.000Z',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/intent-score-explained`,
      lastModified: '2026-04-12T00:00:00.000Z',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/global-dating-across-cultures`,
      lastModified: '2026-04-05T00:00:00.000Z',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: '2026-03-01T00:00:00.000Z',
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE}/terms`,
      lastModified: '2026-03-01T00:00:00.000Z',
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE}/auth`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
