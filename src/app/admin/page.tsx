'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldAlert, Flag } from 'lucide-react'
import type { AdminModerationCase, ModerationStatus } from '@/lib/admin-moderation'
import { fetchCases } from '@/lib/admin-moderation'
import AdminControlShell from '@/components/Admin/AdminControlShell'
import AdminPageHeader from '@/components/Admin/AdminPageHeader'
import ModerationStatusTabs from '@/components/Admin/ModerationStatusTabs'
import ModerationCaseList from '@/components/Admin/ModerationCaseList'
import ModerationCasePanel from '@/components/Admin/ModerationCasePanel'
import { useAdminGuard } from '@/hooks/useAdminGuard'

export default function AdminPage() {
  const { loading: authLoading, authorized } = useAdminGuard()
  const [status, setStatus] = useState<ModerationStatus>('open')
  const [items, setItems] = useState<AdminModerationCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCases(status)
      .then((rows) => {
        if (cancelled) return
        setItems(rows)
        setSelectedCaseId((current) => {
          if (current && rows.some((r) => r.case_id === current)) return current
          return rows[0]?.case_id ?? null
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load moderation dashboard')
        setItems([])
        setSelectedCaseId(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [status])

  const selectedItem = useMemo(
    () => items.find((item) => item.case_id === selectedCaseId) ?? null,
    [items, selectedCaseId]
  )

  const reloadCases = useCallback(async () => {
    const rows = await fetchCases(status)
    setItems(rows)
    setSelectedCaseId((current) => {
      if (current && rows.some((r) => r.case_id === current)) return current
      return rows[0]?.case_id ?? null
    })
    setError(null)
  }, [status])

  if (authLoading || !authorized) return null

  return (
    <AdminControlShell active="moderation">
      <AdminPageHeader
        icon={ShieldAlert}
        iconColor="#f03868"
        title="Moderation"
        subtitle="Review reports, inspect details, and take actions."
        loading={loading}
        right={
          <span style={{
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid rgba(240,56,104,0.22)',
            background: 'rgba(240,56,104,0.08)',
            fontSize: 12, color: '#fda4b4', fontWeight: 600,
          }}>
            {items.length} {items.length === 1 ? 'case' : 'cases'}
          </span>
        }
      />

      <div className="a-inner-pad" style={{ padding: '16px 20px 32px' }}>

        {/* Filter bar */}
        <div className="a-mod-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <ModerationStatusTabs value={status} onChange={(next) => { setStatus(next); setSelectedCaseId(null) }} />
          <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.35)', fontWeight: 500 }}>
            {loading ? 'Loading…' : `${items.length} result${items.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {/* Error */}
        {error && !loading && (
          <div style={{
            borderRadius: 14, padding: '13px 16px',
            border: '1px solid rgba(248,113,113,0.45)',
            background: 'rgba(127,29,29,0.32)',
            color: '#fecaca', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="a-twopanel">
            <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
              {[80, 80, 80].map((_, i) => (
                <div key={i} style={{ height: 80, margin: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', animation: 'mod-shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <div style={{ height: 240, borderRadius: 14, background: 'rgba(255,255,255,0.03)', animation: 'mod-shimmer 1.4s ease-in-out infinite' }} />
          </div>
        )}

        {/* Empty state — no cases */}
        {!loading && !error && items.length === 0 && (
          <div style={{
            marginTop: 8,
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
            padding: '64px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            textAlign: 'center',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'rgba(240,56,104,0.1)',
              border: '1px solid rgba(240,56,104,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flag size={26} color="rgba(240,56,104,0.5)" strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'rgba(240,232,244,0.6)' }}>
                No {status.replace('_', ' ')} cases
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(240,232,244,0.3)', maxWidth: 320 }}>
                {status === 'open'
                  ? 'All reports have been reviewed. Check the In Review or Resolved tabs.'
                  : `No cases currently in the "${status.replace('_', ' ')}" status.`}
              </p>
            </div>
          </div>
        )}

        {/* Case grid */}
        {!loading && !error && items.length > 0 && (
          <section className="a-twopanel">
            <ModerationCaseList
              cases={items}
              selectedCaseId={selectedCaseId}
              onSelect={setSelectedCaseId}
            />
            <ModerationCasePanel
              item={selectedItem}
              onDecisionComplete={reloadCases}
            />
          </section>
        )}
      </div>

      <style>{`
        @keyframes mod-shimmer {
          0%, 100% { opacity: 0.4 }
          50%       { opacity: 0.8 }
        }
      `}</style>
    </AdminControlShell>
  )
}
