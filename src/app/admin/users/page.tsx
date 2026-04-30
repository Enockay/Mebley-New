'use client'

import AdminControlShell from '@/components/Admin/AdminControlShell'
import AdminUsersPanel from '@/components/Admin/AdminUsersPanel'
import { useAdminGuard } from '@/hooks/useAdminGuard'

export default function AdminUsersPage() {
  const { loading, authorized } = useAdminGuard()
  if (loading || !authorized) return null

  return (
    <AdminControlShell active="users">
      <AdminUsersPanel />
    </AdminControlShell>
  )
}
