'use client'
/**
 * Public site header (review M1, 4.5, 4.7): Features, How it works, Safety,
 * Pricing, Stories, a separate Log in link and a single gradient Join free
 * button. Below 1024 px the links move into a full-height menu sheet that is
 * keyboard operable (Escape closes, focus is trapped and restored).
 */
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Icon from './Icon'
import Logo from './Logo'

export const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how', label: 'How it works' },
  { href: '/safety', label: 'Safety' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#stories', label: 'Stories' },
] as const

const SHEET_EXTRA = [
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const sheetRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const sheet = sheetRef.current
    const focusables = () =>
      Array.from(sheet?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    const trigger = btnRef.current
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      trigger?.focus()
    }
  }, [open])

  const current = (href: string) => (href === pathname ? 'page' : undefined)

  // The sheet is a sibling of <header>, not a child: the header's
  // backdrop-filter would otherwise become the containing block for position: fixed.
  return (
    <>
    <header className="mk-header">
      <a href="#main" className="mk-skip">Skip to content</a>
      <div className="mk-container mk-header__inner">
        <Logo />
        <nav className="mk-nav" aria-label="Main">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} aria-current={current(l.href)}>{l.label}</a>
          ))}
        </nav>
        <div className="mk-header__actions">
          <a href="/auth" className="mk-btn mk-btn--ghost mk-btn--sm mk-header__login">Log in</a>
          <a href="/auth" className="mk-btn mk-btn--primary mk-btn--sm">Join free</a>
          <button
            ref={btnRef}
            type="button"
            className="mk-menu-btn"
            aria-expanded={open}
            aria-controls="mk-menu-sheet"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" title="Open menu" />
          </button>
        </div>
      </div>
    </header>

      {open ? (
        <div
          id="mk-menu-sheet"
          ref={sheetRef}
          className="mk-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="mk-sheet__top">
            <Logo />
            <button type="button" className="mk-menu-btn" onClick={() => setOpen(false)}>
              <Icon name="close" title="Close menu" />
            </button>
          </div>
          <nav aria-label="Mobile">
            {[...NAV_LINKS, ...SHEET_EXTRA].map(l => (
              <a key={l.href} href={l.href} aria-current={current(l.href)} onClick={() => setOpen(false)}>
                {l.label}
                <Icon name="chevron" size={20} />
              </a>
            ))}
          </nav>
          <div className="mk-sheet__cta">
            <a href="/auth" className="mk-btn mk-btn--primary mk-btn--block">Join free</a>
            <a href="/auth" className="mk-btn mk-btn--secondary mk-btn--block">Log in</a>
          </div>
        </div>
      ) : null}
    </>
  )
}
