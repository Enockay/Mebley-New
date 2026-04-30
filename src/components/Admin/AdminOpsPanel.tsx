'use client'

import { useCallback, useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import type { ConsistencyIssue, PaystackFulfillment } from '@/lib/admin-ops-api'
import AdminPageHeader from '@/components/Admin/AdminPageHeader'
import {
  fetchConsistencyIssues,
  fetchFulfillments,
  resolveConsistencyIssue,
} from '@/lib/admin-ops-api'

type Tab = 'issues' | 'fulfillments'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function SeverityBadge({ severity }: { severity: string }) {
  const isCrit = severity === 'critical'
  return (
    <span
      style={{
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
        background: isCrit ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
        color: isCrit ? '#fca5a5' : '#fde68a',
        border: `1px solid ${isCrit ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
        textTransform: 'capitalize',
      }}
    >
      {severity}
    </span>
  )
}

function FulfillmentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; fg: string; border: string }> = {
    fulfilled:  { bg: 'rgba(34,197,94,0.15)',  fg: '#86efac', border: 'rgba(34,197,94,0.35)' },
    failed:     { bg: 'rgba(239,68,68,0.15)',   fg: '#fca5a5', border: 'rgba(239,68,68,0.35)' },
    processing: { bg: 'rgba(99,102,241,0.15)',  fg: '#c7d2fe', border: 'rgba(99,102,241,0.35)' },
  }
  const s = styles[status] ?? { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(240,232,244,0.6)', border: 'rgba(255,255,255,0.12)' }
  return (
    <span
      style={{
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  )
}

/* ── Consistency Issues ───────────────────────────────────────── */

function IssuesPane() {
  const [items, setItems]           = useState<ConsistencyIssue[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [severity, setSeverity]     = useState('')
  const [resolving, setResolving]   = useState<string | null>(null)
  const [feedback, setFeedback]     = useState<{ id: string; ok: boolean; msg: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchConsistencyIssues({
        resolved: showResolved,
        severity: severity || undefined,
        limit: 100,
      })
      setItems(res.issues)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }, [showResolved, severity])

  useEffect(() => { load() }, [load])

  const handleResolve = async (id: string) => {
    setResolving(id)
    setFeedback(null)
    try {
      await resolveConsistencyIssue(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      setTotal((t) => t - 1)
      setFeedback({ id, ok: true, msg: 'Issue marked resolved.' })
    } catch (err) {
      setFeedback({ id, ok: false, msg: err instanceof Error ? err.message : 'Failed' })
    } finally {
      setResolving(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: 'rgba(240,232,244,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Severity
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            style={{ marginLeft: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#f0e8f4', padding: '5px 8px', fontSize: 12 }}
          >
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
          </select>
        </label>

        <label style={{ fontSize: 12, color: 'rgba(240,232,244,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            style={{ accentColor: '#f03868' }}
          />
          Show resolved
        </label>

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(240,232,244,0.4)' }}>
          {total} issue{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && (
        <div style={{ padding: 14, fontSize: 13, color: 'rgba(240,232,244,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{ padding: 12, fontSize: 13, color: '#fecaca', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(127,29,29,0.3)', borderRadius: 12 }}>
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'rgba(240,232,244,0.4)', border: '1px dashed rgba(255,255,255,0.14)', borderRadius: 12 }}>
          {showResolved ? 'No resolved issues.' : 'No open issues. System looks healthy.'}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((issue) => (
            <div
              key={issue.id}
              style={{
                borderRadius: 12,
                border: issue.severity === 'critical'
                  ? '1px solid rgba(239,68,68,0.3)'
                  : '1px solid rgba(245,158,11,0.25)',
                background: issue.severity === 'critical'
                  ? 'rgba(239,68,68,0.06)'
                  : 'rgba(245,158,11,0.05)',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <SeverityBadge severity={issue.severity} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f0e8f4' }}>{issue.source}</span>
                    <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.45)' }}>{timeAgo(issue.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,232,244,0.85)' }}>
                    <span style={{ color: 'rgba(240,232,244,0.5)' }}>{issue.entity_type}</span>
                    {' · '}
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{issue.entity_id}</span>
                  </p>
                  {Object.keys(issue.details ?? {}).length > 0 && (
                    <pre
                      style={{
                        margin: '8px 0 0',
                        fontSize: 11,
                        color: 'rgba(240,232,244,0.55)',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        overflow: 'auto',
                        maxHeight: 80,
                      }}
                    >
                      {JSON.stringify(issue.details, null, 2)}
                    </pre>
                  )}
                </div>

                {!issue.resolved && (
                  <button
                    onClick={() => handleResolve(issue.id)}
                    disabled={resolving === issue.id}
                    style={{
                      padding: '7px 13px',
                      borderRadius: 8,
                      border: '1px solid rgba(34,197,94,0.4)',
                      background: 'rgba(34,197,94,0.1)',
                      color: '#86efac',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: resolving === issue.id ? 'not-allowed' : 'pointer',
                      opacity: resolving === issue.id ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {resolving === issue.id ? '…' : 'Resolve'}
                  </button>
                )}

                {issue.resolved && (
                  <span style={{ fontSize: 11, color: 'rgba(34,197,94,0.7)', whiteSpace: 'nowrap', paddingTop: 4 }}>
                    Resolved {timeAgo(issue.resolved_at ?? issue.created_at)}
                  </span>
                )}
              </div>

              {feedback?.id === issue.id && (
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: 12,
                    color: feedback.ok ? '#86efac' : '#fca5a5',
                  }}
                >
                  {feedback.msg}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Paystack Fulfillments ────────────────────────────────────── */

function FulfillmentsPane() {
  const [items, setItems]       = useState<PaystackFulfillment[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchFulfillments({ status: statusFilter || undefined, limit: 100 })
      setItems(res.fulfillments)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fulfillments')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: 'rgba(240,232,244,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ marginLeft: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#f0e8f4', padding: '5px 8px', fontSize: 12 }}
          >
            <option value="">All</option>
            <option value="processing">Processing</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(240,232,244,0.4)' }}>
          {total} record{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && (
        <div style={{ padding: 14, fontSize: 13, color: 'rgba(240,232,244,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{ padding: 12, fontSize: 13, color: '#fecaca', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(127,29,29,0.3)', borderRadius: 12 }}>
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'rgba(240,232,244,0.4)', border: '1px dashed rgba(255,255,255,0.14)', borderRadius: 12 }}>
          No payment fulfillment records found.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left' }}>
                {['Reference', 'Status', 'Type', 'Attempts', 'Last error', 'Created', 'Fulfilled at'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', fontWeight: 700, color: 'rgba(240,232,244,0.8)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.reference} style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, monospace', color: 'rgba(200,220,255,0.85)', wordBreak: 'break-all' }}>
                    {row.reference}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <FulfillmentStatusBadge status={row.status} />
                  </td>
                  <td style={{ padding: '10px 12px', color: 'rgba(240,232,244,0.75)' }}>
                    {row.fulfillment_type ?? '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: row.attempts > 3 ? '#fca5a5' : 'rgba(240,232,244,0.8)', fontWeight: row.attempts > 3 ? 700 : 400 }}>
                    {row.attempts}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#fca5a5', maxWidth: 220, wordBreak: 'break-word' }}>
                    {row.last_error ?? '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'rgba(240,232,244,0.65)', whiteSpace: 'nowrap' }}>
                    {formatDate(row.created_at)}
                  </td>
                  <td style={{ padding: '10px 12px', color: row.fulfilled_at ? '#86efac' : 'rgba(240,232,244,0.4)', whiteSpace: 'nowrap' }}>
                    {formatDate(row.fulfilled_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Shell ────────────────────────────────────────────────────── */

export default function AdminOpsPanel() {
  const [tab, setTab] = useState<Tab>('issues')

  const tabBtn = (t: Tab, label: string) => {
    const active = tab === t
    return (
      <button
        onClick={() => setTab(t)}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: active ? '1px solid rgba(240,56,104,0.45)' : '1px solid rgba(255,255,255,0.12)',
          background: active ? 'rgba(240,56,104,0.18)' : 'rgba(255,255,255,0.04)',
          color: active ? '#ffd6df' : 'rgba(240,232,244,0.75)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div>
      <AdminPageHeader
        icon={Wrench}
        iconColor="#f59e0b"
        title="Operations"
        subtitle="Consistency issues and payment fulfillments."
      />

      <div style={{ padding: '16px 18px 32px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {tabBtn('issues', 'Consistency Issues')}
          {tabBtn('fulfillments', 'Payment Fulfillments')}
        </div>

        {tab === 'issues' && <IssuesPane />}
        {tab === 'fulfillments' && <FulfillmentsPane />}
      </div>
    </div>
  )
}
