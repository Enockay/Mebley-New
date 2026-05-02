'use client'

import { useEffect, useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import type { AdminAuditEntry } from '@/lib/admin-audit'
import { fetchAdminAuditLog } from '@/lib/admin-audit'
import AdminPageHeader from '@/components/Admin/AdminPageHeader'

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function shortId(id: string | undefined): string {
  if (!id) return '—'
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`
}

function actionLabel(action: string): string {
  if (action === 'moderation_ban') return 'Ban'
  if (action === 'moderation_dismiss') return 'Dismiss'
  if (action === 'credits_admin_grant') return 'Credits grant'
  if (action === 'credits_admin_remove') return 'Credits remove'
  if (action === 'user_deactivate') return 'Deactivate user'
  if (action === 'user_reactivate') return 'Reactivate user'
  if (action === 'verification_approved') return 'ID verification approved'
  if (action === 'verification_rejected') return 'ID verification rejected'
  return action
}

export default function AdminAuditLog() {
  const pageSize = 25
  const [offset, setOffset] = useState(0)
  const [actionFilter, setActionFilter] = useState<
    | 'all'
    | 'moderation_ban'
    | 'moderation_dismiss'
    | 'credits_admin_grant'
    | 'credits_admin_remove'
    | 'user_deactivate'
    | 'user_reactivate'
    | 'verification_approved'
    | 'verification_rejected'
  >('all')
  const [items, setItems] = useState<AdminAuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchAdminAuditLog({
      limit: pageSize,
      offset,
      action: actionFilter === 'all' ? undefined : actionFilter,
    })
      .then((res) => {
        if (cancelled) return
        setItems(res.items)
        setTotal(res.total)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load audit log')
        setItems([])
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [offset, actionFilter])

  const hasPrev = offset > 0
  const hasMore = offset + items.length < total

  const rangeLabel = useMemo(() => {
    if (total === 0) return '0 entries'
    const from = offset + 1
    const to = offset + items.length
    return `${from}–${to} of ${total}`
  }, [total, offset, items.length])

  return (
    <div>
      <AdminPageHeader
        icon={ScrollText}
        iconColor="#818cf8"
        title="Audit Log"
        subtitle="Immutable record of all admin actions."
        loading={loading}
        right={
          <span style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(240,232,244,0.6)', fontWeight: 600 }}>
            {rangeLabel}
          </span>
        }
      />

      <div className="a-inner-pad" style={{ padding: '16px 16px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'rgba(240,232,244,0.65)' }}>
            Action{' '}
            <select
              value={actionFilter}
              onChange={(e) => {
                setOffset(0)
                setActionFilter(e.target.value as typeof actionFilter)
              }}
              style={{
                marginLeft: 6,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.06)',
                color: '#f0e8f4',
                padding: '6px 10px',
                fontSize: 13,
              }}
            >
              <option value="all">All</option>
              <option value="moderation_ban">Ban</option>
              <option value="moderation_dismiss">Dismiss</option>
              <option value="credits_admin_grant">Credits grant</option>
              <option value="credits_admin_remove">Credits remove</option>
              <option value="user_deactivate">Deactivate user</option>
              <option value="user_reactivate">Reactivate user</option>
              <option value="verification_approved">ID verification approved</option>
              <option value="verification_rejected">ID verification rejected</option>
            </select>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled={!hasPrev || loading}
              onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
              style={{
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.18)',
                background: hasPrev && !loading ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                color: '#e8dff0',
                padding: '6px 12px',
                fontSize: 12,
                cursor: hasPrev && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasMore || loading}
              onClick={() => setOffset((o) => o + pageSize)}
              style={{
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.18)',
                background: hasMore && !loading ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                color: '#e8dff0',
                padding: '6px 12px',
                fontSize: 12,
                cursor: hasMore && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              Next
            </button>
          </div>
        </div>

        {loading && (
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: 14,
              color: 'rgba(240,232,244,0.7)',
              fontSize: 13,
            }}
          >
            Loading audit entries...
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              border: '1px solid rgba(248,113,113,0.45)',
              background: 'rgba(127,29,29,0.32)',
              borderRadius: 14,
              padding: 14,
              color: '#fecaca',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div
            style={{
              border: '1px dashed rgba(255,255,255,0.18)',
              borderRadius: 14,
              padding: 20,
              color: 'rgba(240,232,244,0.6)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            No audit entries yet. Actions appear here after bans or dismissals from moderation.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="a-table-wrap">
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12,
                minWidth: 720,
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'rgba(240,232,244,0.85)' }}>When</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'rgba(240,232,244,0.85)' }}>Action</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'rgba(240,232,244,0.85)' }}>Actor</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'rgba(240,232,244,0.85)' }}>Target user</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'rgba(240,232,244,0.85)' }}>Case ID</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'rgba(240,232,244,0.85)' }}>Report ID</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'rgba(240,232,244,0.85)' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const meta = row.metadata ?? {}
                  const caseId = typeof meta.caseId === 'string' ? meta.caseId : undefined
                  const reportId = typeof meta.reportId === 'string' ? meta.reportId : undefined
                  const notes = typeof meta.notes === 'string' ? meta.notes : null
                  const targetLabel =
                    row.target_user?.full_name?.trim() ||
                    (row.target_user?.id ? shortId(row.target_user.id) : '—')

                  return (
                    <tr key={row.id} style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,232,244,0.9)', whiteSpace: 'nowrap' }}>
                        {formatWhen(row.created_at)}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#fbcfe8', fontWeight: 600 }}>
                        {actionLabel(row.action)}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,232,244,0.88)', wordBreak: 'break-all' }}>
                        {row.actor.email}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,232,244,0.82)', wordBreak: 'break-word' }}>
                        {targetLabel}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 11,
                          color: 'rgba(200,220,255,0.85)',
                          wordBreak: 'break-all',
                        }}
                        title={caseId}
                      >
                        {shortId(caseId)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 11,
                          color: 'rgba(200,220,255,0.85)',
                          wordBreak: 'break-all',
                        }}
                        title={reportId}
                      >
                        {shortId(reportId)}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,232,244,0.7)', maxWidth: 220 }}>
                        {notes?.trim() ? notes : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
