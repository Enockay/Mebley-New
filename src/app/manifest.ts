import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mebley — Modern Connections',
    short_name: 'Mebley',
    description:
      'Voice-first dating app for intentional connections across 40+ countries.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09071a',
    theme_color: '#1f0b12',
    orientation: 'portrait',
    scope: '/',
    lang: 'en',
    categories: ['lifestyle', 'social'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    screenshots: [
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'Browse Matches',
        url: '/browse',
        description: 'Discover new people',
      },
      {
        name: 'Messages',
        url: '/matches?panel=chats',
        description: 'Open your conversations',
      },
    ],
  }
}
