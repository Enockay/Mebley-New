'use client'

import AdminControlShell from '@/components/Admin/AdminControlShell'
import AdminOverviewPanel from '@/components/Admin/AdminOverviewPanel'
import { useAdminGuard } from '@/hooks/useAdminGuard'

export default function AdminOverviewPage() {
  const { loading, authorized } = useAdminGuard()
  if (loading || !authorized) return null

  return (
    <AdminControlShell active="overview">
      <AdminOverviewPanel />
    </AdminControlShell>
  )
}
