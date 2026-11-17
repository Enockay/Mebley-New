'use client'
/**
 * Lets a visitor see prices for another region (review 4.12, "Display
 * currency"). It only changes what is displayed; checkout always charges the
 * price for the country it detects.
 */
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { REGION_CHOICES } from '@/lib/pricing'

export default function RegionPicker({ current, detected }: { current: string | null; detected: string | null }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function choose(code: string) {
    const auto = code === 'auto' || code === detected
    document.cookie = auto
      ? 'mb_region=; Path=/; Max-Age=0; SameSite=Lax'
      : `mb_region=${code}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`
    start(() => router.refresh())
  }

  const options = REGION_CHOICES.some(r => r.code === current) || !current
    ? REGION_CHOICES
    : [{ code: current, name: current }, ...REGION_CHOICES]

  return (
    <label className="mk-region">
      <span>Show prices for</span>
      <select value={current ?? 'auto'} onChange={e => choose(e.target.value)} disabled={pending} aria-busy={pending}>
        {detected ? null : <option value="auto">Automatic</option>}
        {options.map(r => (
          <option key={r.code} value={r.code}>{r.name}{r.code === detected ? ' (your location)' : ''}</option>
        ))}
      </select>
    </label>
  )
}
