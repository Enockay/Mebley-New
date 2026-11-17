/**
 * Dev-only media studio. Renders the store screenshots and the demo video
 * frames from the same components the website uses, so the media stays in
 * step with the design system. Captured by scripts/render-media.mjs.
 *
 *   /studio?shot=1..5   one 430 x 932 store screenshot (captured at 3x)
 *   /studio?video=1     the 1280 x 720 demo stage, driven by window.__seek(t)
 *
 * Returns 404 in production builds.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Studio from './Studio'

export const metadata: Metadata = { title: 'Media studio', robots: { index: false, follow: false } }

export default async function StudioPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const q = await searchParams
  if (q.video) return <Studio mode="video" />
  return <Studio mode="shot" shot={Math.min(5, Math.max(1, Number(q.shot) || 1))} />
}
