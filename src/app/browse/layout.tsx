import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse',
  robots: { index: false, follow: false },
}

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
