'use client'

import AdminControlShell from '@/components/Admin/AdminControlShell'
import AdminAuditLog from '@/components/Admin/AdminAuditLog'
import { useAdminGuard } from '@/hooks/useAdminGuard'

export default function AdminAuditPage() {
  const { loading, authorized } = useAdminGuard()
  if (loading || !authorized) return null

  return (
    <AdminControlShell
      active="audit"
      sidebarFooter={
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(240,232,244,0.56)' }}>About</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(240,232,244,0.78)', lineHeight: 1.45 }}>
            Immutable record of ban and dismiss actions. Hover shortened IDs for full UUIDs.
          </p>
        </div>
      }
    >
      <AdminAuditLog />
    </AdminControlShell>
  )
}
