'use client'

import AdminControlShell from '@/components/Admin/AdminControlShell'
import AdminCreditsConsole from '@/components/Admin/AdminCreditsConsole'
import { useAdminGuard } from '@/hooks/useAdminGuard'

export default function AdminCreditsPage() {
  const { loading, authorized } = useAdminGuard()
  if (loading || !authorized) return null

  return (
    <AdminControlShell
      active="credits"
      sidebarFooter={
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(240,232,244,0.56)' }}>Note</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(240,232,244,0.78)', lineHeight: 1.45 }}>
            USD revenue reads Supabase <code style={{ fontSize: 11 }}>stripe_orders</code>. Grants/removals are logged in{' '}
            <code style={{ fontSize: 11 }}>credit_transactions</code> and <code style={{ fontSize: 11 }}>admin_actions</code>.
          </p>
        </div>
      }
    >
      <AdminCreditsConsole />
    </AdminControlShell>
  )
}
