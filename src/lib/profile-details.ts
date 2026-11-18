/**
 * Optional profile details (migration 20261118_022_profile_details.sql):
 * occupation, height, education, languages, drinking and children. Shared by
 * the edit form, the profile API and the Discover screens.
 */

export const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High school' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: 'Bachelor’s' },
  { value: 'masters', label: 'Master’s' },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'trade', label: 'Trade school' },
] as const

export const DRINKING_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'socially', label: 'Socially' },
  { value: 'often', label: 'Often' },
] as const

export const CHILDREN_OPTIONS = [
  { value: 'want', label: 'Wants kids' },
  { value: 'open', label: 'Open to kids' },
  { value: 'dont_want', label: 'Doesn’t want kids' },
  { value: 'have', label: 'Has kids' },
  { value: 'have_want_more', label: 'Has kids, wants more' },
] as const

export const LANGUAGE_OPTIONS = [
  'English', 'Swahili', 'French', 'Arabic', 'Spanish', 'Portuguese', 'Hindi', 'Amharic',
  'Somali', 'Yoruba', 'Igbo', 'Hausa', 'Zulu', 'Luganda', 'Kikuyu', 'Luo', 'German', 'Italian',
  'Mandarin', 'Indonesian', 'Turkish', 'Urdu',
] as const

export const OCCUPATION_MAX = 60
export const HEIGHT_MIN_CM = 120
export const HEIGHT_MAX_CM = 230

export type ProfileDetails = {
  occupation?: string | null
  height_cm?: number | null
  education?: string | null
  languages?: string[] | null
  drinking?: string | null
  children?: string | null
}

const labelOf = (list: readonly { value: string; label: string }[], v?: string | null) =>
  list.find(o => o.value === v)?.label ?? null

/** 168 -> "5′6″ (168 cm)" */
export function formatHeight(cm?: number | null): string | null {
  if (!cm) return null
  const totalIn = Math.round(cm / 2.54)
  return `${Math.floor(totalIn / 12)}′${totalIn % 12}″ (${cm} cm)`
}

export const educationLabel = (v?: string | null) => labelOf(EDUCATION_OPTIONS, v)
export const drinkingLabel = (v?: string | null) => labelOf(DRINKING_OPTIONS, v)
export const childrenLabel = (v?: string | null) => labelOf(CHILDREN_OPTIONS, v)

/** The "Basics" tiles shown on a profile, skipping anything not filled in. */
export function basicsTiles(p: ProfileDetails): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  const h = formatHeight(p.height_cm)
  if (h) out.push({ label: 'Height', value: h.split(' (')[0] })
  const e = educationLabel(p.education)
  if (e) out.push({ label: 'Education', value: e })
  if (p.languages?.length) out.push({ label: 'Languages', value: p.languages.slice(0, 3).join(', ') })
  const d = drinkingLabel(p.drinking)
  if (d) out.push({ label: 'Drinks', value: d })
  return out
}

/** Validates and normalises details from a request body. Unknown keys are ignored. */
export function sanitizeDetails(body: Record<string, unknown>): { ok: true; value: ProfileDetails } | { ok: false; error: string } {
  const out: ProfileDetails = {}
  const inList = (list: readonly { value: string }[], v: unknown) => v === null || v === '' || list.some(o => o.value === v)

  if ('occupation' in body) {
    const v = body.occupation
    if (v !== null && typeof v !== 'string') return { ok: false, error: 'Invalid occupation' }
    out.occupation = typeof v === 'string' ? v.trim().slice(0, OCCUPATION_MAX) || null : null
  }
  if ('height_cm' in body) {
    const v = body.height_cm
    if (v === null || v === '') out.height_cm = null
    else {
      const n = Number(v)
      if (!Number.isInteger(n) || n < HEIGHT_MIN_CM || n > HEIGHT_MAX_CM) return { ok: false, error: 'Height must be between 120 and 230 cm' }
      out.height_cm = n
    }
  }
  if ('education' in body) {
    if (!inList(EDUCATION_OPTIONS, body.education)) return { ok: false, error: 'Invalid education' }
    out.education = (body.education as string) || null
  }
  if ('drinking' in body) {
    if (!inList(DRINKING_OPTIONS, body.drinking)) return { ok: false, error: 'Invalid drinking value' }
    out.drinking = (body.drinking as string) || null
  }
  if ('children' in body) {
    if (!inList(CHILDREN_OPTIONS, body.children)) return { ok: false, error: 'Invalid children value' }
    out.children = (body.children as string) || null
  }
  if ('languages' in body) {
    const v = body.languages
    if (!Array.isArray(v) || !v.every(x => typeof x === 'string' && (LANGUAGE_OPTIONS as readonly string[]).includes(x))) {
      return { ok: false, error: 'Invalid languages' }
    }
    out.languages = [...new Set(v as string[])].slice(0, 6)
  }
  return { ok: true, value: out }
}
