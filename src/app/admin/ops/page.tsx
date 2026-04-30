'use client'

import AdminControlShell from '@/components/Admin/AdminControlShell'
import AdminOpsPanel from '@/components/Admin/AdminOpsPanel'
import { useAdminGuard } from '@/hooks/useAdminGuard'

export default function AdminOpsPage() {
  const { loading, authorized } = useAdminGuard()
  if (loading || !authorized) return null

  return (
    <AdminControlShell active="ops">
      <AdminOpsPanel />
    </AdminControlShell>
  )
}
