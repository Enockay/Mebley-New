// src/components/UI/MarketingLayout.tsx
// Shared header + footer for marketing/content pages (About, Blog, Contact).
// Delegates to the public-site design system so every page has the same
// navigation, mobile menu and footer as the home page.
import MarketingShell from '@/components/Marketing/MarketingShell'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>
}
