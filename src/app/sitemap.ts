import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE = getSiteUrl()
  const now = new Date().toISOString()

  return [
    { url: BASE,               lastModified: now,                         changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/auth`,     lastModified: now,                         changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/upgrade`,  lastModified: now,                         changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/about`,    lastModified: now,                         changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/blog`,     lastModified: now,                         changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/contact`,  lastModified: now,                         changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE}/privacy`,  lastModified: '2026-03-01T00:00:00.000Z', changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE}/terms`,    lastModified: '2026-03-01T00:00:00.000Z', changeFrequency: 'yearly',  priority: 0.4 },
  ]
}
