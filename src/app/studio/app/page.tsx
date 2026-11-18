/**
 * Dev-only previews of the signed-in app with sample data:
 *   /studio/app?screen=discover | profile | chats | chat | me | likes
 * Returns 404 in production builds.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AppPreview from './AppPreview'

export const metadata: Metadata = { title: 'App preview', robots: { index: false, follow: false } }

export default async function AppPreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { screen = 'discover' } = await searchParams
  return <AppPreview screen={screen} />
}
