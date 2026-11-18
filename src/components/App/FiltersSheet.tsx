'use client'
/** "All filters" dialog for Discover: area, intentions, age ranges, interests. */
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { INTERESTS_BY_CATEGORY, RELATIONSHIP_INTENTS } from '@/types/app-constants'
import { AGE_RANGE_LABELS } from './discover-model'

export type Filters = { location: string; intents: string[]; interests: string[]; ageRanges: string[] }
export const EMPTY_FILTERS: Filters = { location: '', intents: [], interests: [], ageRanges: [] }

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v])

export default function FiltersSheet({ value, onApply, onClose }: { value: Filters; onApply: (f: Filters) => void; onClose: () => void }) {
  const [f, setF] = useState<Filters>(value)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input, button')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="ma ma-sheet-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ma-sheet" role="dialog" aria-modal="true" aria-labelledby="ma-filters-title" ref={ref}>
        <div className="ma-sheet__head">
          <h2 id="ma-filters-title">Filters</h2>
          <button type="button" className="ma-iconbtn" onClick={onClose} aria-label="Close filters"><X size={20} /></button>
        </div>

        <label className="ma-field">
          <span className="ma-label">Area</span>
          <input className="ma-input" value={f.location} placeholder="e.g. Kilimani, Westlands" onChange={e => setF({ ...f, location: e.target.value })} />
        </label>

        <fieldset className="ma-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ma-label" style={{ marginBottom: 8 }}>Looking for</legend>
          <div className="ma-chips">
            {RELATIONSHIP_INTENTS.map(i => (
              <button key={i.value} type="button" className="ma-chip" aria-pressed={f.intents.includes(i.value)} onClick={() => setF({ ...f, intents: toggle(f.intents, i.value) })}>{i.label}</button>
            ))}
          </div>
        </fieldset>

        <fieldset className="ma-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ma-label" style={{ marginBottom: 8 }}>Age</legend>
          <div className="ma-chips">
            {Object.entries(AGE_RANGE_LABELS).map(([v, label]) => (
              <button key={v} type="button" className="ma-chip" aria-pressed={f.ageRanges.includes(v)} onClick={() => setF({ ...f, ageRanges: toggle(f.ageRanges, v) })}>{label}</button>
            ))}
          </div>
        </fieldset>

        {INTERESTS_BY_CATEGORY.map(cat => (
          <fieldset key={cat.label} className="ma-field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="ma-label" style={{ marginBottom: 8 }}>{cat.label}</legend>
            <div className="ma-chips">
              {cat.tags.map(t => (
                <button key={t} type="button" className="ma-chip" aria-pressed={f.interests.includes(t)} onClick={() => setF({ ...f, interests: toggle(f.interests, t) })}>{t}</button>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="ma-sheet__foot">
          <button type="button" className="ma-btn" onClick={() => setF(EMPTY_FILTERS)}>Clear all</button>
          <button type="button" className="ma-btn ma-btn--primary" onClick={() => onApply(f)}>Show people</button>
        </div>
      </div>
    </div>
  )
}
