'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, type ReactNode } from 'react'
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  ScrollText,
  Coins,
  Wrench,
  Settings,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'

export type AdminSection =
  | 'overview'
  | 'moderation'
  | 'users'
  | 'audit'
  | 'credits'
  | 'ops'
  | 'settings'

const NAV_ITEMS: {
  section: AdminSection
  label: string
  href: string
  icon: React.ElementType
  description: string
}[] = [
  { section: 'overview',   label: 'Overview',         href: '/admin/overview', icon: LayoutDashboard, description: 'Platform health & stats'  },
  { section: 'moderation', label: 'Moderation',       href: '/admin',          icon: ShieldAlert,     description: 'Reports & ban decisions'  },
  { section: 'users',      label: 'Users',             href: '/admin/users',    icon: Users,           description: 'Accounts & profiles'      },
  { section: 'audit',      label: 'Audit Log',         href: '/admin/audit',    icon: ScrollText,      description: 'Immutable action history' },
  { section: 'credits',    label: 'Credits & Revenue', href: '/admin/credits',  icon: Coins,           description: 'Wallets, grants & revenue'},
  { section: 'ops',        label: 'Operations',        href: '/admin/ops',      icon: Wrench,          description: 'Issues & fulfillments'    },
  { section: 'settings',   label: 'Settings',          href: '/admin/settings', icon: Settings,        description: 'Admin profile & password' },
]

export default function AdminControlShell(props: {
  active: AdminSection
  sidebarFooter?: ReactNode
  children: ReactNode
}) {
  const { active, sidebarFooter, children } = props
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  /* Close sidebar when route changes */
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  /* Prevent body scroll when sidebar open on mobile */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const currentNav = NAV_ITEMS.find((n) => n.section === active)

  return (
    <div
      className="a-shell"
      style={{
        background:
          'radial-gradient(ellipse 60% 40% at 0% 100%, rgba(240,56,104,0.07), transparent 60%), radial-gradient(ellipse 50% 60% at 100% 0%, rgba(100,40,180,0.07), transparent 70%), #080614',
        color: '#f0e8f4',
        fontFamily: "'DM Sans', sans-serif",
        minWidth: 0,
      }}
    >
      {/* ── Sidebar backdrop overlay (mobile) ── */}
      <div
        className={`a-overlay${open ? ' a-open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside
        className={`a-sidebar${open ? ' a-open' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(8,6,20,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          overflow: 'hidden',
          width: 280,
        }}
      >
        {/* Brand header */}
        <div
          style={{
            padding: '20px 18px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #f03868 0%, #8b23c6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(240,56,104,0.35)',
              }}
            >
              <ShieldAlert size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Control Panel
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(240,232,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Admin
              </p>
            </div>
          </div>

          {/* Close button — only visible on mobile via CSS */}
          <button
            className="a-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ section, label, href, icon: Icon, description }) => {
            const isActive = active === section
            return (
              <Link
                key={section}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '10px 11px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  position: 'relative',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(240,56,104,0.18) 0%, rgba(240,56,104,0.07) 100%)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(240,56,104,0.28)'
                    : '1px solid transparent',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {/* Active accent bar */}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3, height: 22,
                      borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #f03868, #c026d3)',
                    }}
                  />
                )}

                {/* Icon */}
                <span
                  style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'rgba(240,56,104,0.22)' : 'rgba(255,255,255,0.05)',
                    border: isActive ? '1px solid rgba(240,56,104,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    transition: 'background 0.15s',
                  }}
                >
                  <Icon size={15} strokeWidth={2} color={isActive ? '#f9a8c9' : 'rgba(240,232,244,0.6)'} />
                </span>

                {/* Text */}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : 'rgba(240,232,244,0.8)',
                    lineHeight: 1.3,
                  }}>
                    {label}
                  </span>
                  <span style={{
                    display: 'block', fontSize: 11, marginTop: 1,
                    color: isActive ? 'rgba(249,168,201,0.65)' : 'rgba(240,232,244,0.33)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {description}
                  </span>
                </span>

                <ChevronRight
                  size={13} strokeWidth={2.5} style={{ flexShrink: 0 }}
                  color={isActive ? 'rgba(249,168,201,0.6)' : 'rgba(240,232,244,0.18)'}
                />
              </Link>
            )
          })}
        </nav>

        {/* Optional sidebar footer */}
        {sidebarFooter != null && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {sidebarFooter}
          </div>
        )}

        {/* System status strip */}
        <div style={{
          padding: '11px 18px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.32)' }}>System operational</span>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="a-main">
        {/* Mobile top bar — shown only on small screens via CSS */}
        <div className="a-mobile-topbar">
          <button
            className="a-hamburger"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            style={{ position: 'static', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)' }}
          >
            <Menu size={18} strokeWidth={2} />
          </button>

          {/* Brand logo in mobile bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: 'linear-gradient(135deg, #f03868, #8b23c6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldAlert size={13} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {currentNav?.label ?? 'Admin'}
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
