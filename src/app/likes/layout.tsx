import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Likes you',
  robots: { index: false, follow: false },
}

export default function LikesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
