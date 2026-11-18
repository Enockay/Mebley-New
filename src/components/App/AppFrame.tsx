'use client'
/**
 * Signed-in app frame (2026 redesign).
 * Desktop: top bar (logo, area search, credits, notifications, account) and a
 * left sidebar (navigation, profile strength, Spotlight).
 * Mobile: compact top bar and a four-tab bottom nav.
 *
 * Data comes from useAuth plus two light counts (likes received, unread
 * chats). Pass `preview` to render with sample data (dev studio only).
 */
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bell, Heart, LogOut, MessageCircle, Search, Shield, ShieldCheck, Sparkles, Star, User, CircleDot, ChevronRight, Crown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePaywall } from '@/hooks/usePaywall'
import NotificationBell from '@/components/UI/NotificationBell'
import './app.css'

export type FrameData = {
  name: string
  photo: string | null
  credits: number
  completeness: number
  likes: number
  unread: number
  isAdmin: boolean
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'M'

const NAV = [
  { href: '/browse', label: 'Discover', short: 'Discover', icon: Sparkles, key: 'discover' },
  { href: '/likes', label: 'Likes you', short: 'Likes', icon: Heart, key: 'likes' },
  { href: '/matches', label: 'Messages', short: 'Chats', icon: MessageCircle, key: 'messages' },
  { href: '/profile', label: 'My profile', short: 'Me', icon: User, key: 'profile' },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/browse') return pathname === '/browse' || pathname === '/discover'
  return pathname === href || pathname.startsWith(href + '/')
}

/** Live counts for the nav badges. Refreshes every 30 s while visible. */
function useFrameData(enabled: boolean): FrameData {
  const { profile, creditBalance, isAdmin } = useAuth()
  const [likes, setLikes] = useState(0)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!enabled || !profile) return
    let live = true
    const load = () => {
      if (document.visibilityState !== 'visible') return
      fetch('/api/likes/received', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (live && d) setLikes(Number(d.count) || 0) })
        .catch(() => {})
      fetch('/api/chat/conversations', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (!live || !d) return
          const list = Array.isArray(d.conversations) ? d.conversations : []
          setUnread(list.reduce((n: number, c: { unreadCount?: number }) => n + (typeof c?.unreadCount === 'number' ? c.unreadCount : 0), 0))
        })
        .catch(() => {})
    }
    load()
    const t = setInterval(load, 30_000)
    return () => { live = false; clearInterval(t) }
  }, [enabled, profile])

  const p = profile as unknown as { full_name?: string; photos?: { url?: string }[]; profile_completeness?: number } | null
  return {
    name: p?.full_name ?? '',
    photo: p?.photos?.[0]?.url ?? null,
    credits: Math.max(0, Number(creditBalance ?? 0)),
    completeness: Math.max(0, Math.min(100, Number(p?.profile_completeness ?? 0))),
    likes,
    unread,
    isAdmin,
  }
}

function Avatar({ name, photo, round = false, size }: { name: string; photo: string | null; round?: boolean; size?: number }) {
  return (
    <span className={`ma-avatar${round ? ' ma-avatar--round' : ''}`} style={size ? { width: size, height: size } : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo} alt="" /> : initials(name)}
    </span>
  )
}

function Logo() {
  return (
    <Link href="/browse" className="ma-logo" aria-label="Mebley, go to Discover">
      <span className="ma-logo__mark"><Heart size={18} fill="currentColor" strokeWidth={0} /></span>
      <span>Mebley</span>
    </Link>
  )
}

function Credits({ credits, compact = false, onTopUp }: { credits: number; compact?: boolean; onTopUp: () => void }) {
  return (
    <button type="button" className="ma-credits" onClick={onTopUp} aria-label={`${credits} credits. Top up`}>
      <CircleDot size={18} />
      <span>{credits.toLocaleString('en-US')}{compact ? '' : ' credits'}</span>
      {compact ? null : <><span className="ma-credits__sep" aria-hidden="true" /><span className="ma-credits__cta">Top up</span></>}
    </button>
  )
}

function AccountMenu({ data }: { data: FrameData }) {
  const { signOut } = useAuth()
  const router = useRouter()
  const { openPaywall } = usePaywall()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])

  return (
    <div className="ma-menu" ref={ref}>
      <button type="button" className="ma-userchip" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Avatar name={data.name} photo={data.photo} />
        <span>{data.name.split(' ')[0] || 'Me'}</span>
      </button>
      {open ? (
        <div className="ma-menu__list" role="menu">
          <button role="menuitem" onClick={() => { setOpen(false); router.push('/profile') }}><User size={16} /> My profile</button>
          <button role="menuitem" onClick={() => { setOpen(false); openPaywall('general', 'plans') }}><Crown size={16} /> Plans and credits</button>
          <button role="menuitem" onClick={() => { setOpen(false); router.push('/safety') }}><ShieldCheck size={16} /> Safety centre</button>
          {data.isAdmin ? <button role="menuitem" onClick={() => { setOpen(false); router.push('/admin') }}><Shield size={16} /> Admin</button> : null}
          <button role="menuitem" className="ma-danger" onClick={async () => { setOpen(false); await signOut(); router.push('/auth') }}><LogOut size={16} /> Sign out</button>
        </div>
      ) : null}
    </div>
  )
}

function AreaSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  return (
    <form
      className="ma-search"
      role="search"
      onSubmit={e => { e.preventDefault(); router.push(`/browse?area=${encodeURIComponent(q.trim())}`) }}
    >
      <Search size={18} aria-hidden="true" />
      <label htmlFor="ma-area" className="ma-sr">Search by area</label>
      <input id="ma-area" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by area, e.g. Kilimani, Westlands…" />
    </form>
  )
}

function BellButton({ preview }: { preview: boolean }) {
  // The real bell manages its own dropdown and unread state.
  if (!preview) return <span className="ma-iconbtn"><NotificationBell /></span>
  return <span className="ma-iconbtn" aria-label="Notifications"><Bell size={20} /><span className="ma-dot" /></span>
}

export default function AppFrame({
  children,
  preview,
  previewPath,
  bareMobile = false,
}: {
  children: ReactNode
  /** Sample data for the dev studio. */
  preview?: FrameData
  previewPath?: string
  /** Hide the mobile top bar (full-screen views such as a chat thread). */
  bareMobile?: boolean
}) {
  const pathname = usePathname() ?? ''
  const path = previewPath ?? pathname
  const live = useFrameData(!preview)
  const data = preview ?? live
  const { openPaywall } = usePaywall()
  const topUp = () => openPaywall('general', 'credits')
  const { refreshProfile } = useAuth()
  const [spotBusy, setSpotBusy] = useState(false)
  /** Spotlight: 120 credits, top of Discover nearby for 24 hours. */
  const activateSpotlight = async () => {
    if (preview || spotBusy) return
    if (!window.confirm('Use 120 credits to show your profile first to people nearby for 24 hours?')) return
    setSpotBusy(true)
    try {
      const res = await fetch('/api/credits/spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: 'spotlight', type: 'boost' }) })
      if (res.status === 402) { openPaywall('spotlight', 'credits'); return }
      if (!res.ok) { const b = await res.json().catch(() => ({})); window.alert(b?.error ?? 'Could not start Spotlight'); return }
      await refreshProfile()
      window.alert('Spotlight is on for the next 24 hours.')
    } finally {
      setSpotBusy(false)
    }
  }
  const strengthTip = data.completeness >= 100 ? null : data.completeness >= 80 ? 'Answer a prompt' : 'Add photos and prompts'
  const stepsLeft = data.completeness >= 100 ? 0 : Math.max(1, Math.ceil((100 - data.completeness) / 15))

  return (
    <div className={`ma ma-shell${bareMobile ? ' ma-shell--bare' : ''}`}>
      {/* Desktop top bar */}
      <header className="ma-top">
        <Logo />
        <AreaSearch />
        <div className="ma-top__right">
          <Credits credits={data.credits} onTopUp={topUp} />
          <BellButton preview={!!preview} />
          <AccountMenu data={data} />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="ma-side" aria-label="Main">
        <nav className="ma-nav">
          {NAV.map(({ href, label, icon: Icon, key }) => {
            const count = key === 'likes' ? data.likes : key === 'messages' ? data.unread : 0
            return (
              <Link key={href} href={href} aria-current={isActive(path, href) ? 'page' : undefined}>
                <Icon size={20} />
                {label}
                {count > 0 ? <span className={`ma-badge${key === 'likes' ? ' ma-badge--gold' : ''}`}>{count > 99 ? '99+' : count}</span> : null}
              </Link>
            )
          })}
          <Link href="/safety" aria-current={isActive(path, '/safety') ? 'page' : undefined}>
            <Shield size={20} />
            Safety centre
          </Link>
        </nav>

        <section className="ma-strength" aria-label="Profile strength">
          <p className="ma-label">Profile strength</p>
          <div className="ma-strength__row">
            <span className="ma-strength__pct">{data.completeness}%</span>
            <span className="ma-muted" style={{ fontSize: 14 }}>{stepsLeft === 0 ? 'Complete' : `${stepsLeft} step${stepsLeft > 1 ? 's' : ''} left`}</span>
          </div>
          <div className="ma-bar" role="progressbar" aria-valuenow={data.completeness} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${data.completeness}%` }} /></div>
          {strengthTip ? <Link href="/profile?edit=1" className="ma-link">{strengthTip} <ChevronRight size={16} /></Link> : null}
        </section>

        <section className="ma-spot" aria-label="Spotlight">
          <div className="ma-spot__title"><Star size={18} /> Spotlight</div>
          <p>Show your profile first to people nearby for 24 hours.</p>
          <button type="button" className="ma-btn ma-btn--gold ma-btn--sm ma-btn--block" onClick={() => activateSpotlight()} disabled={spotBusy}>
            {spotBusy ? 'Starting…' : 'Boost · 120 credits'}
          </button>
        </section>
      </aside>

      {/* Mobile top bar */}
      <header className="ma-mtop">
        <Logo />
        <span style={{ marginInlineStart: 'auto' }} />
        <Credits credits={data.credits} compact onTopUp={topUp} />
        <BellButton preview={!!preview} />
      </header>

      <main className="ma-main" id="main">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="ma-bnav" aria-label="Main">
        {NAV.map(({ href, short, icon: Icon, key }) => {
          const count = key === 'likes' ? data.likes : key === 'messages' ? data.unread : 0
          return (
            <Link key={href} href={href} aria-current={isActive(path, href) ? 'page' : undefined}>
              <Icon size={22} />
              {short}
              {count > 0 ? <span className={`ma-bnav__badge${key === 'likes' ? ' ma-bnav__badge--gold' : ''}`}>{count > 99 ? '99+' : count}</span> : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
