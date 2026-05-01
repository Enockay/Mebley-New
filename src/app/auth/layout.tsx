import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In or Join Free',
  description:
    'Create your free Mebley account or sign in to continue making intentional connections across 40+ countries.',
  alternates: { canonical: 'https://mebley.com/auth' },
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
