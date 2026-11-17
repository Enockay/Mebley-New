/**
 * Wraps every public page in the .mk design-system scope with the shared
 * header and footer. Pages provide their own <main id="main"> content.
 */
import type { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'
import StickyJoin from './StickyJoin'

export default function MarketingShell({ children, stickyJoin = false }: { children: ReactNode; stickyJoin?: boolean }) {
  return (
    <div className="mk">
      <SiteHeader />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>{children}</main>
      <SiteFooter />
      {stickyJoin ? <StickyJoin /> : null}
    </div>
  )
}
