import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mebley: Voice First Dating',
    short_name: 'Mebley',
    description:
      'Voice first dating. Hear someone before you match.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0A1E',
    theme_color: '#0C0A1E',
    orientation: 'portrait',
    scope: '/',
    lang: 'en',
    categories: ['lifestyle', 'social'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
