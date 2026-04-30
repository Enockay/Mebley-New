export type AdminSettingsProfile = {
  email: string
  profile: {
    full_name: string
    username: string
    bio: string
  } | null
}

export async function fetchAdminSettingsProfile(): Promise<AdminSettingsProfile> {
  const res = await fetch('/api/admin/settings/profile', { credentials: 'include', cache: 'no-store' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Failed to load profile')
  }
  return body as AdminSettingsProfile
}

export async function updateAdminSettingsProfile(payload: {
  full_name?: string
  username?: string
  bio?: string
}): Promise<{ profile: { full_name: string; username: string; bio: string } }> {
  const res = await fetch('/api/admin/settings/profile', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Failed to save profile')
  }
  return body
}

export async function updateAdminPassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const res = await fetch('/api/admin/settings/password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Failed to update password')
  }
}
