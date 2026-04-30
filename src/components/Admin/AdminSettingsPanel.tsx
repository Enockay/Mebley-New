'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Settings,
  User,
  Lock,
  Terminal,
  ArrowLeft,
  Save,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Shield,
  Copy,
  Check,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchAdminSettingsProfile,
  updateAdminPassword,
  updateAdminSettingsProfile,
  type AdminSettingsProfile,
} from '@/lib/admin-settings-api'
import AdminPageHeader from '@/components/Admin/AdminPageHeader'

/* ─── Feedback ───────────────────────────────────────────────────── */

function Feedback({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        padding: '11px 14px',
        borderRadius: 10,
        border: ok ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(248,113,113,0.4)',
        background: ok ? 'rgba(34,197,94,0.07)' : 'rgba(127,29,29,0.22)',
        fontSize: 13,
        color: ok ? '#86efac' : '#fecaca',
      }}
    >
      {ok
        ? <CheckCircle2 size={14} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
        : <AlertCircle   size={14} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
      }
      {msg}
    </div>
  )
}

/* ─── Labelled input field ───────────────────────────────────────── */

const BASE_INPUT: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f0e8f4',
  padding: '11px 14px',
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 7 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,232,244,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

/* ─── Card ───────────────────────────────────────────────────────── */

function Card({
  icon: Icon,
  iconColor,
  iconBg,
  accent,
  title,
  badge,
  children,
}: {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  accent: string
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${accent}20`,
        background: `linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Glow blob */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: accent, opacity: 0.05, filter: 'blur(30px)', pointerEvents: 'none' }} />

      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '15px 20px',
          borderBottom: `1px solid ${accent}14`,
          background: `${accent}06`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: iconBg, border: `1px solid ${accent}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={16} color={iconColor} strokeWidth={2} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f0e8f4' }}>{title}</span>
        </div>
        {badge}
      </div>

      {/* Card body */}
      <div style={{ padding: '22px 22px' }}>{children}</div>
    </div>
  )
}

/* ─── Copy button for commands ───────────────────────────────────── */

function CopyCmd({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div style={{ position: 'relative', borderRadius: 9, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <code style={{ display: 'block', padding: '10px 44px 10px 14px', fontSize: 11, color: '#93c5fd', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>
        {cmd}
      </code>
      <button
        type="button"
        onClick={copy}
        title="Copy"
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: copied ? '#86efac' : 'rgba(240,232,244,0.35)', padding: 4,
        }}
      >
        {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
      </button>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */

export default function AdminSettingsPanel() {
  const { refreshProfile } = useAuth()

  const [loading, setLoading]             = useState(true)
  const [loadErr, setLoadErr]             = useState<string | null>(null)
  const [data, setData]                   = useState<AdminSettingsProfile | null>(null)

  const [fullName, setFullName]           = useState('')
  const [username, setUsername]           = useState('')
  const [bio, setBio]                     = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg]       = useState<{ ok: boolean; msg: string } | null>(null)

  const [currentPassword, setCurrentPassword]   = useState('')
  const [newPassword, setNewPassword]           = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [pwdSaving, setPwdSaving]               = useState(false)
  const [pwdMsg, setPwdMsg]                     = useState<{ ok: boolean; msg: string } | null>(null)

  const load = useCallback(async () => {
    setLoadErr(null)
    setLoading(true)
    try {
      const d = await fetchAdminSettingsProfile()
      setData(d)
      if (d.profile) {
        setFullName(d.profile.full_name)
        setUsername(d.profile.username)
        setBio(d.profile.bio)
      }
    } catch (e: unknown) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const saveProfile = async () => {
    if (!data?.profile) return
    setProfileMsg(null)
    setProfileSaving(true)
    try {
      const res = await updateAdminSettingsProfile({ full_name: fullName, username, bio })
      setData((prev) => (prev ? { ...prev, profile: res.profile } : prev))
      setProfileMsg({ ok: true, msg: 'Profile saved successfully.' })
      await refreshProfile()
    } catch (e: unknown) {
      setProfileMsg({ ok: false, msg: e instanceof Error ? e.message : 'Save failed' })
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async () => {
    setPwdMsg(null)
    if (newPassword !== confirmPassword) {
      setPwdMsg({ ok: false, msg: 'New passwords do not match.' })
      return
    }
    setPwdSaving(true)
    try {
      await updateAdminPassword({ currentPassword, newPassword })
      setPwdMsg({ ok: true, msg: 'Password updated. Other sessions were signed out.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: unknown) {
      setPwdMsg({ ok: false, msg: e instanceof Error ? e.message : 'Update failed' })
    } finally {
      setPwdSaving(false)
    }
  }

  /* Avatar initials */
  const avatarInitials = (() => {
    if (!data) return '?'
    const n = data.profile?.full_name || data.profile?.username || data.email || '?'
    return n.slice(0, 2).toUpperCase()
  })()

  return (
    <div>
      <AdminPageHeader
        icon={Settings}
        iconColor="#94a3b8"
        title="Settings"
        subtitle="Manage your admin account profile and password."
        loading={loading}
        right={
          <Link
            href="/browse"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              borderRadius: 9, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)', color: 'rgba(240,232,244,0.75)',
              padding: '7px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <ArrowLeft size={13} strokeWidth={2.2} />
            Back to app
          </Link>
        }
      />

      <div style={{ padding: '24px 28px 56px' }}>

        {loading && (
          <div style={{ display: 'grid', gap: 16 }}>
            {[200, 380, 320].map((h) => (
              <div key={h} style={{ height: h, borderRadius: 18, background: 'rgba(255,255,255,0.04)', animation: 'set-shimmer 1.4s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {loadErr && (
          <div style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(127,29,29,0.22)', color: '#fecaca', fontSize: 13 }}>
            {loadErr}
          </div>
        )}

        {!loading && data && (
          <div style={{ display: 'grid', gap: 18 }}>

            {/* ── Identity card ── */}
            <div
              style={{
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(135deg, rgba(240,56,104,0.07) 0%, rgba(168,85,247,0.06) 50%, rgba(255,255,255,0.02) 100%)',
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: '#f03868', opacity: 0.06, filter: 'blur(40px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -40, right: 40, width: 120, height: 120, borderRadius: '50%', background: '#a855f7', opacity: 0.06, filter: 'blur(35px)', pointerEvents: 'none' }} />

              {/* Avatar */}
              <div
                style={{
                  width: 60, height: 60, borderRadius: 16, flexShrink: 0,
                  background: 'linear-gradient(135deg, #f03868, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, color: '#fff',
                  boxShadow: '0 6px 20px rgba(240,56,104,0.3)',
                }}
              >
                {avatarInitials}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff' }}>
                    {data.profile?.full_name || data.profile?.username || 'Admin'}
                  </p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    borderRadius: 999, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                    background: 'rgba(240,56,104,0.18)', border: '1px solid rgba(240,56,104,0.4)', color: '#fda4b4',
                  }}>
                    <Shield size={9} strokeWidth={2.5} />
                    Admin
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,232,244,0.5)' }}>{data.email}</p>
                {data.profile?.username && (
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(240,232,244,0.35)' }}>@{data.profile.username}</p>
                )}
              </div>
            </div>

            {/* ── Two-column grid: Profile + Password ── */}
            <div className="a-form2">

              {/* Profile card */}
              <Card icon={User} iconColor="#818cf8" iconBg="rgba(129,140,248,0.12)" accent="#818cf8" title="Profile">
                <div style={{ display: 'grid', gap: 16 }}>
                  <Field label="Email (sign-in)">
                    <input
                      readOnly
                      value={data.email}
                      style={{ ...BASE_INPUT, opacity: 0.55, cursor: 'default' }}
                    />
                  </Field>

                  {!data.profile ? (
                    <div style={{
                      padding: '14px 16px', borderRadius: 10,
                      border: '1px solid rgba(234,179,8,0.28)', background: 'rgba(234,179,8,0.07)',
                      fontSize: 13, color: '#fde68a', lineHeight: 1.5,
                    }}>
                      No dating profile on file. Finish onboarding in the app, then edit display name and bio here.
                    </div>
                  ) : (
                    <>
                      <Field label="Display name">
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your display name"
                          style={BASE_INPUT}
                        />
                      </Field>
                      <Field label="Username">
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(240,232,244,0.35)', pointerEvents: 'none' }}>@</span>
                          <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username"
                            style={{ ...BASE_INPUT, paddingLeft: 26 }}
                          />
                        </div>
                      </Field>
                      <Field label="Bio">
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Short bio…"
                          rows={3}
                          style={{ ...BASE_INPUT, resize: 'vertical', minHeight: 80 }}
                        />
                      </Field>

                      <button
                        type="button"
                        disabled={profileSaving}
                        onClick={saveProfile}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          borderRadius: 10, width: '100%',
                          border: '1px solid rgba(129,140,248,0.4)',
                          background: profileSaving ? 'rgba(129,140,248,0.08)' : 'linear-gradient(135deg, rgba(129,140,248,0.25), rgba(129,140,248,0.12))',
                          color: '#c7d2fe', padding: '12px 20px',
                          fontSize: 13, fontWeight: 700,
                          cursor: profileSaving ? 'wait' : 'pointer',
                          opacity: profileSaving ? 0.7 : 1,
                        }}
                      >
                        <Save size={14} strokeWidth={2.2} />
                        {profileSaving ? 'Saving…' : 'Save profile'}
                      </button>

                      {profileMsg && <Feedback ok={profileMsg.ok} msg={profileMsg.msg} />}
                    </>
                  )}
                </div>
              </Card>

              {/* Password card */}
              <Card icon={Lock} iconColor="#a855f7" iconBg="rgba(168,85,247,0.12)" accent="#a855f7" title="Password">
                <div style={{ display: 'grid', gap: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(240,232,244,0.4)', lineHeight: 1.6, padding: '10px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    Changing your password signs out other devices. This browser session stays active.
                  </p>

                  <Field label="Current password">
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={BASE_INPUT}
                    />
                  </Field>
                  <Field label="New password">
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      style={BASE_INPUT}
                    />
                  </Field>
                  <Field label="Confirm new password">
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      onKeyDown={(e) => e.key === 'Enter' && savePassword()}
                      style={{
                        ...BASE_INPUT,
                        borderColor: confirmPassword && confirmPassword !== newPassword
                          ? 'rgba(248,113,113,0.5)'
                          : confirmPassword && confirmPassword === newPassword
                            ? 'rgba(34,197,94,0.4)'
                            : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  </Field>

                  <button
                    type="button"
                    disabled={pwdSaving}
                    onClick={savePassword}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      borderRadius: 10, width: '100%',
                      border: '1px solid rgba(168,85,247,0.4)',
                      background: pwdSaving ? 'rgba(168,85,247,0.08)' : 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(168,85,247,0.12))',
                      color: '#e9d5ff', padding: '12px 20px',
                      fontSize: 13, fontWeight: 700,
                      cursor: pwdSaving ? 'wait' : 'pointer',
                      opacity: pwdSaving ? 0.7 : 1,
                    }}
                  >
                    <KeyRound size={14} strokeWidth={2.2} />
                    {pwdSaving ? 'Updating…' : 'Change password'}
                  </button>

                  {pwdMsg && <Feedback ok={pwdMsg.ok} msg={pwdMsg.msg} />}
                </div>
              </Card>
            </div>

            {/* ── Ops reference ── */}
            <Card icon={Terminal} iconColor="#22d3ee" iconBg="rgba(34,211,238,0.1)" accent="#22d3ee" title="Operations Reference">
              <div className="a-opsref">
                {[
                  { label: 'Grant admin role', cmd: 'npm run grant:admin -- --email you@example.com' },
                  { label: 'Run all migrations', cmd: 'npm run migrate:sql -- --all' },
                ].map(({ label, cmd }) => (
                  <div key={cmd}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'rgba(240,232,244,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {label}
                    </p>
                    <CopyCmd cmd={cmd} />
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )}
      </div>

      <style>{`
        @keyframes set-shimmer {
          0%, 100% { opacity: 0.4 }
          50%       { opacity: 0.8 }
        }
      `}</style>
    </div>
  )
}
