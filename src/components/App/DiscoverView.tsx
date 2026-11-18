'use client'
/**
 * Discover screen (2026 redesign). Purely presentational: all data and
 * actions come in as props from the /browse page (or the dev studio).
 *
 * Desktop: header, filter chips, the current card with actions, an Up next
 * list, and an About panel on the right. Mobile: filter chips, the card, the
 * actions, and a full-screen profile view.
 */
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, Heart, MapPin, MessageCircle, MoreHorizontal, RefreshCw, SlidersHorizontal, Star, X, Flag, BadgeCheck, Mic } from 'lucide-react'
import VoiceNotePlayer from '@/components/UI/VoiceNotePlayer'
import { basicsTiles } from '@/lib/profile-details'
import { DISCOVER_MESSAGE_START_CREDITS } from '@/lib/discover-message-start.constants'
import { type DiscoverPerson, intentLabel, lookingForChips, matchSummary, whereText } from './discover-model'

/* eslint-disable @next/next/no-img-element */

export type ChipKey = 'age' | 'near' | 'serious' | 'verified' | 'online'
export type ChipState = Record<ChipKey, boolean> & { ageLabel: string; nearKm: number; filterCount: number }

export type DiscoverActions = {
  onLike: (p: DiscoverPerson) => void
  onPass: (p: DiscoverPerson) => void
  /** Stitch: a like with a personal note. `context` is the prompt being replied to. */
  onStitch: (p: DiscoverPerson, context?: string) => void
  onMessage: (p: DiscoverPerson) => void
  onReport: (p: DiscoverPerson) => void
  onSelect: (p: DiscoverPerson) => void
  onViewed?: (p: DiscoverPerson) => void
}

type Props = DiscoverActions & {
  people: DiscoverPerson[]
  selectedId: string | null
  subtitle: string
  mode: 'cards' | 'grid'
  onMode: (m: 'cards' | 'grid') => void
  chips: ChipState
  onToggleChip: (k: ChipKey) => void
  onOpenFilters: () => void
  busy: boolean
  loading: boolean
  error: string | null
  onRetry: () => void
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  /** Mobile full profile currently open */
  fullProfileId: string | null
  onOpenFullProfile: (p: DiscoverPerson | null) => void
}

/* ─── Small parts ─────────────────────────────────────────────────── */

function PhotoBars({ count, index }: { count: number; index: number }) {
  const n = Math.max(1, Math.min(count, 6))
  return (
    <div className="ma-pcard__bars" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <span key={i} data-on={i === index} />)}
    </div>
  )
}

function Verified() {
  return <span className="ma-verified" title="Photo verified"><BadgeCheck size={24} fill="currentColor" stroke="var(--ma-bg)" /><span className="ma-sr">Photo verified</span></span>
}

function PersonMenu({ person, onMessage, onReport, align = 'right' }: { person: DiscoverPerson; onMessage: () => void; onReport: () => void; align?: 'right' | 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])
  return (
    <div className="ma-menu" ref={ref}>
      <button type="button" className="ma-iconbtn" aria-label={`More options for ${person.name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <MoreHorizontal size={20} />
      </button>
      {open ? (
        <div className="ma-menu__list" role="menu" style={align === 'left' ? { left: 0, right: 'auto' } : undefined}>
          <button role="menuitem" onClick={() => { setOpen(false); onMessage() }}>
            <MessageCircle size={16} /> Message now · {DISCOVER_MESSAGE_START_CREDITS} credits
          </button>
          <button role="menuitem" className="ma-danger" onClick={() => { setOpen(false); onReport() }}>
            <Flag size={16} /> Block or report
          </button>
        </div>
      ) : null}
    </div>
  )
}

/* ─── Profile card ────────────────────────────────────────────────── */

function ProfileCard({ person, onOpenFullProfile, photoIndex, setPhotoIndex }: {
  person: DiscoverPerson
  onOpenFullProfile: () => void
  photoIndex: number
  setPhotoIndex: (i: number) => void
}) {
  const photo = person.photos[photoIndex] ?? person.photos[0]
  const count = person.photos.length
  const tags = [...person.lookingFor.slice(0, 1).map(v => ({ t: intentLabel(v), c: true })), ...person.interests.slice(0, 2).map(t => ({ t, c: false }))]
  return (
    <article className={`ma-pcard${person.spotlight ? ' ma-pcard--spot' : ''}`} aria-label={`${person.name}${person.ageLabel ? `, ${person.ageLabel}` : ''}`}>
      {photo ? <img className="ma-pcard__img" src={photo} alt={`Photo ${photoIndex + 1} of ${person.name}`} /> : <div className="ma-pcard__placeholder" aria-hidden="true" />}
      <div className="ma-pcard__scrim" />
      <PhotoBars count={count} index={photoIndex} />
      {count > 1 ? (
        <>
          <button type="button" className="ma-pcard__tap ma-pcard__tap--prev" aria-label="Previous photo" onClick={() => setPhotoIndex((photoIndex - 1 + count) % count)} />
          <button type="button" className="ma-pcard__tap ma-pcard__tap--next" aria-label="Next photo" onClick={() => setPhotoIndex((photoIndex + 1) % count)} />
        </>
      ) : null}
      <div className="ma-pcard__badges">
        <span>
          {person.spotlight ? <span className="ma-pill"><Star size={14} /> Spotlight</span> : null}
          {person.hereTonight ? <span className="ma-pill ma-pill--coral" style={{ marginInlineStart: 6 }}>Here tonight</span> : null}
        </span>
        <span className="ma-pill">{person.score}% match</span>
      </div>
      <div className="ma-pcard__info">
        <h2 className="ma-name">
          {person.name}{person.ageLabel ? `, ${person.ageLabel}` : ''}
          {person.verified ? <Verified /> : null}
          {person.online ? <span className="ma-online" title="Online now" /> : null}
        </h2>
        {whereText(person, { away: true, full: true }) ? (
          <p className="ma-where" style={{ margin: 0 }}><MapPin size={16} aria-hidden="true" /> {whereText(person, { away: true, full: true })}</p>
        ) : null}
        <div className="ma-pcard__tags ma-mobile-only">
          {tags.map(x => <span key={x.t} className={`ma-tag ma-tag--sm${x.c ? ' ma-tag--coral' : ''}`}>{x.t}</span>)}
        </div>
        <button type="button" className="ma-pcard__more ma-mobile-only" onClick={onOpenFullProfile}>
          View full profile <ChevronRight size={18} />
        </button>
      </div>
    </article>
  )
}

function ActionBar({ person, busy, onPass, onStitch, onLike }: { person: DiscoverPerson; busy: boolean; onPass: () => void; onStitch: () => void; onLike: () => void }) {
  return (
    <div className="ma-actions" data-discover-actions>
      <button type="button" className="ma-act ma-act--pass" onClick={onPass} disabled={busy} aria-label={`Pass on ${person.name}`}><X size={26} /></button>
      <button type="button" className="ma-act ma-act--star" onClick={onStitch} disabled={busy} aria-label={`Send ${person.name} a Stitch, a like with a note`}><Star size={24} /></button>
      <button type="button" className="ma-act ma-act--like" onClick={onLike} disabled={busy} aria-label={`Like ${person.name}`}><Heart size={30} fill="currentColor" strokeWidth={0} /></button>
    </div>
  )
}

/* ─── Up next ─────────────────────────────────────────────────────── */

function UpNext({ people, onSelect }: { people: DiscoverPerson[]; onSelect: (p: DiscoverPerson) => void }) {
  if (people.length === 0) return null
  return (
    <section className="ma-upnext-wrap" aria-labelledby="ma-upnext">
      <p id="ma-upnext" className="ma-label" style={{ marginBottom: 12 }}>Up next</p>
      <ul className="ma-upnext" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {people.map(p => (
          <li key={p.id}>
            <button type="button" className="ma-person" onClick={() => onSelect(p)}>
              <span className="ma-person__img">
                {p.photos[0] ? <img src={p.photos[0]} alt="" /> : <span className="ma-pcard__placeholder" aria-hidden="true" />}
              </span>
              <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                <span className="ma-person__name">{p.name}{p.ageLabel ? `, ${p.ageLabel}` : ''}</span>
                <span className="ma-person__meta">{whereText(p) || 'Nearby'}</span>
                <span className="ma-person__match">{p.score}% match</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─── Shared profile detail sections ──────────────────────────────── */

function DetailSections({ person, onReply, photoThumbs }: { person: DiscoverPerson; onReply?: (q: string) => void; photoThumbs?: React.ReactNode }) {
  const looking = lookingForChips(person)
  const basics = basicsTiles({ height_cm: person.heightCm, education: person.education, languages: person.languages, drinking: person.drinking })
  return (
    <>
      {photoThumbs}
      {looking.length ? (
        <section className="ma-section">
          <p className="ma-label">Looking for</p>
          <div className="ma-chips">{looking.map(c => <span key={c.label} className={`ma-tag${c.accent ? ' ma-tag--coral' : ''}`}>{c.label}</span>)}</div>
        </section>
      ) : null}
      {person.voiceNoteUrl ? (
        <section className="ma-section">
          <p className="ma-label"><Mic size={13} style={{ verticalAlign: '-2px' }} /> Voice note</p>
          <VoiceNotePlayer url={person.voiceNoteUrl} accent="#e8355f" />
        </section>
      ) : null}
      {person.prompts.slice(0, 3).map(pr => (
        <article key={pr.question} className="ma-prompt">
          <p className="ma-prompt__q">{pr.question}</p>
          <p className="ma-prompt__a">{pr.answer}</p>
          {onReply ? <button type="button" className="ma-prompt__reply" onClick={() => onReply(pr.question)}>Reply to this</button> : null}
        </article>
      ))}
      {person.bio ? (
        <section className="ma-section">
          <p className="ma-label">About</p>
          <p style={{ margin: 0, color: 'var(--ma-text-2)' }}>{person.bio}</p>
        </section>
      ) : null}
      {person.interests.length ? (
        <section className="ma-section">
          <p className="ma-label">Interests</p>
          <div className="ma-chips">{person.interests.slice(0, 10).map(t => <span key={t} className="ma-tag">{t}</span>)}</div>
        </section>
      ) : null}
      {basics.length ? (
        <section className="ma-section">
          <p className="ma-label">Basics</p>
          <div className="ma-basics">{basics.map(b => <div key={b.label} className="ma-basic"><span>{b.label}</span><b>{b.value}</b></div>)}</div>
        </section>
      ) : null}
    </>
  )
}

/* ─── About panel (desktop) ───────────────────────────────────────── */

function AboutPanel({ person, photoIndex, setPhotoIndex, actions }: { person: DiscoverPerson; photoIndex: number; setPhotoIndex: (i: number) => void; actions: DiscoverActions }) {
  const thumbs = person.photos.slice(0, 3)
  return (
    <aside className="ma-about ma-about--desktop" aria-label={`About ${person.name}`}>
      <div className="ma-about__head">
        <h2 className="ma-about__title">About {person.name.split(' ')[0]}</h2>
        <PersonMenu person={person} onMessage={() => actions.onMessage(person)} onReport={() => actions.onReport(person)} />
      </div>
      <DetailSections
        person={person}
        onReply={q => actions.onStitch(person, q)}
        photoThumbs={thumbs.length > 1 ? (
          <div className="ma-thumbs">
            {thumbs.map((src, i) => (
              <button key={src} type="button" aria-pressed={i === photoIndex} aria-label={`Show photo ${i + 1}`} onClick={() => setPhotoIndex(i)}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      />
      {person.occupation ? (
        <section className="ma-section">
          <p className="ma-label">Work</p>
          <p style={{ margin: 0 }}>{person.occupation}</p>
        </section>
      ) : null}
      <div className="ma-about__cta">
        <button type="button" className="ma-btn ma-btn--primary" onClick={() => actions.onStitch(person)}>Like &amp; say hi</button>
        <button type="button" className="ma-btn" onClick={() => actions.onReport(person)}>Report</button>
      </div>
    </aside>
  )
}

/* ─── Full profile (mobile) ───────────────────────────────────────── */

/** Full-screen profile. Without `actions` it is view-only (used from a chat). */
export function FullProfile({ person, onClose, actions, busy = false }: { person: DiscoverPerson; onClose: () => void; actions?: DiscoverActions; busy?: boolean }) {
  const [idx, setIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])
  const photo = person.photos[idx] ?? person.photos[0]
  const sub = [person.occupation, whereText(person, { away: true })].filter(Boolean).join(' · ')
  return (
    <div className="ma ma-fp" role="dialog" aria-modal="true" aria-label={`${person.name}'s profile`} tabIndex={-1} ref={ref}>
      <div className="ma-fp__hero">
        {photo ? <img src={photo} alt={`Photo ${idx + 1} of ${person.name}`} /> : <div className="ma-pcard__placeholder" aria-hidden="true" />}
        <PhotoBars count={person.photos.length} index={idx} />
        {person.photos.length > 1 ? (
          <>
            <button type="button" className="ma-pcard__tap ma-pcard__tap--prev" aria-label="Previous photo" onClick={() => setIdx((idx - 1 + person.photos.length) % person.photos.length)} />
            <button type="button" className="ma-pcard__tap ma-pcard__tap--next" aria-label="Next photo" onClick={() => setIdx((idx + 1) % person.photos.length)} />
          </>
        ) : null}
        <div className="ma-fp__nav">
          <button type="button" className="ma-iconbtn" onClick={onClose} aria-label="Back to Discover"><ArrowLeft size={20} /></button>
          {actions ? <PersonMenu person={person} onMessage={() => actions.onMessage(person)} onReport={() => actions.onReport(person)} /> : null}
        </div>
      </div>
      <div className="ma-fp__body">
        <div style={{ display: 'grid', gap: 4 }}>
          <h2 className="ma-name">
            {person.name}{person.ageLabel ? `, ${person.ageLabel}` : ''}
            {person.verified ? <Verified /> : null}
          </h2>
          {sub ? <p className="ma-muted" style={{ margin: 0 }}>{sub}</p> : null}
        </div>
        {person.score > 0 ? (
          <div className="ma-whymatch">
            <b>{person.score}%</b>
            <p>{matchSummary(person)}</p>
          </div>
        ) : null}
        <DetailSections person={person} onReply={actions ? q => actions.onStitch(person, q) : undefined} />
      </div>
      {actions ? <div className="ma-fp__bar">
        <button type="button" className="ma-act ma-act--pass" disabled={busy} onClick={() => { actions.onPass(person); onClose() }} aria-label={`Pass on ${person.name}`}><X size={24} /></button>
        <button type="button" className="ma-btn ma-btn--primary" disabled={busy} onClick={() => { actions.onLike(person); onClose() }}>
          <Heart size={20} fill="currentColor" strokeWidth={0} /> Like {person.name.split(' ')[0]}
        </button>
      </div> : null}
    </div>
  )
}

/* ─── Grid ────────────────────────────────────────────────────────── */

function GridView({ people, onSelect }: { people: DiscoverPerson[]; onSelect: (p: DiscoverPerson) => void }) {
  return (
    <ul className="ma-grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {people.map(p => (
        <li key={p.id}>
          <button type="button" className="ma-gcard" onClick={() => onSelect(p)} aria-label={`${p.name}, ${p.score}% match`}>
            {p.photos[0] ? <img src={p.photos[0]} alt="" /> : <span className="ma-pcard__placeholder" aria-hidden="true" />}
            <span className="ma-pcard__badges" style={{ top: 12 }}><span /><span className="ma-pill">{p.score}%</span></span>
            <span className="ma-gcard__info">
              <b>{p.name}{p.ageLabel ? `, ${p.ageLabel}` : ''}</b>
              <span>{whereText(p) || 'Nearby'}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ─── Filter chips ────────────────────────────────────────────────── */

function FilterChips({ chips, onToggle, onOpenFilters }: { chips: ChipState; onToggle: (k: ChipKey) => void; onOpenFilters: () => void }) {
  return (
    <div className="ma-chips ma-chips--scroll" role="toolbar" aria-label="Filters">
      <button type="button" className="ma-chip" onClick={onOpenFilters}>
        <SlidersHorizontal size={16} />
        <span className="ma-desktop-only">All filters</span><span className="ma-mobile-only">Filters</span>
        {chips.filterCount > 0 ? <span className="ma-badge" style={{ marginInlineStart: 2 }}>{chips.filterCount}</span> : null}
      </button>
      <button type="button" className="ma-chip" aria-pressed={chips.age} onClick={() => onToggle('age')}>
        <span className="ma-desktop-only">Age {chips.ageLabel}</span><span className="ma-mobile-only">{chips.ageLabel}</span>
      </button>
      <button type="button" className="ma-chip" aria-pressed={chips.near} onClick={() => onToggle('near')}>
        <span className="ma-desktop-only">Within {chips.nearKm} km</span><span className="ma-mobile-only">{chips.nearKm} km</span>
      </button>
      <button type="button" className="ma-chip" aria-pressed={chips.serious} onClick={() => onToggle('serious')}>
        <span className="ma-desktop-only">Serious relationship</span><span className="ma-mobile-only">Serious</span>
      </button>
      <button type="button" className="ma-chip" aria-pressed={chips.verified} onClick={() => onToggle('verified')}>Verified only</button>
      <button type="button" className="ma-chip" aria-pressed={chips.online} onClick={() => onToggle('online')}>Online now</button>
    </div>
  )
}

/* ─── Screen ──────────────────────────────────────────────────────── */

export default function DiscoverView(props: Props) {
  const { people, selectedId, mode, busy } = props
  const person = people.find(p => p.id === selectedId) ?? people[0] ?? null
  const upNext = person ? people.filter(p => p.id !== person.id).slice(0, 4) : []
  const full = props.fullProfileId ? people.find(p => p.id === props.fullProfileId) ?? null : null
  const [photoIndex, setPhotoIndex] = useState(0)
  const [photoFor, setPhotoFor] = useState<string | null>(null)
  if (person && photoFor !== person.id) { setPhotoFor(person.id); setPhotoIndex(0) }

  const { onViewed } = props
  useEffect(() => { if (person && onViewed) onViewed(person) }, [person?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: left arrow passes, right arrow likes (cards view, no dialog open)
  const actionsRef = useRef(props)
  useEffect(() => { actionsRef.current = props })
  useEffect(() => {
    if (mode !== 'cards' || !person || full) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.closest('input, textarea, select, [role=dialog], [role=menu]') || t.isContentEditable)) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); actionsRef.current.onPass(person) }
      if (e.key === 'ArrowRight') { e.preventDefault(); actionsRef.current.onLike(person) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, person, full])

  const head = (
    <div className="ma-disc__head">
      <div>
        <h1 className="ma-title">Discover</h1>
        <p className="ma-sub">{props.subtitle}</p>
      </div>
      <div className="ma-seg" role="group" aria-label="View">
        <button type="button" aria-pressed={mode === 'cards'} onClick={() => props.onMode('cards')}>Cards</button>
        <button type="button" aria-pressed={mode === 'grid'} onClick={() => props.onMode('grid')}>Grid</button>
      </div>
    </div>
  )

  let body: React.ReactNode
  if (props.loading && people.length === 0) {
    body = <div className="ma-empty"><div className="ma-spinner" /><p>Finding people for you…</p></div>
  } else if (props.error && people.length === 0) {
    body = (
      <div className="ma-empty">
        <h2>Something went wrong</h2>
        <p>{props.error}</p>
        <button type="button" className="ma-btn ma-btn--primary ma-btn--pill" onClick={props.onRetry}><RefreshCw size={18} /> Try again</button>
      </div>
    )
  } else if (!person) {
    body = (
      <div className="ma-empty">
        <h2>You&rsquo;re all caught up</h2>
        <p>Try widening your filters, or check back soon for new people.</p>
        <div className="ma-chips" style={{ justifyContent: 'center' }}>
          <button type="button" className="ma-btn ma-btn--pill" onClick={props.onOpenFilters}><SlidersHorizontal size={18} /> Adjust filters</button>
          <button type="button" className="ma-btn ma-btn--primary ma-btn--pill" onClick={props.onRetry}><RefreshCw size={18} /> Refresh</button>
        </div>
      </div>
    )
  } else if (mode === 'grid') {
    body = (
      <>
        <GridView people={people} onSelect={p => { props.onSelect(p); props.onMode('cards') }} />
        {props.hasMore ? (
          <button type="button" className="ma-btn ma-btn--pill" style={{ justifySelf: 'center' }} onClick={props.onLoadMore} disabled={props.loadingMore}>
            {props.loadingMore ? 'Loading…' : 'Show more people'}
          </button>
        ) : null}
      </>
    )
  } else {
    body = (
      <div className="ma-stage">
        <div className="ma-stagecard">
          <ProfileCard person={person} photoIndex={photoIndex} setPhotoIndex={setPhotoIndex} onOpenFullProfile={() => props.onOpenFullProfile(person)} />
          <ActionBar person={person} busy={busy} onPass={() => props.onPass(person)} onStitch={() => props.onStitch(person)} onLike={() => props.onLike(person)} />
          <p className="ma-tip">Tip: use ← to pass and → to like</p>
        </div>
        <UpNext people={upNext} onSelect={props.onSelect} />
      </div>
    )
  }

  return (
    <div className="ma-disc">
      <div className="ma-disc__main">
        {head}
        <FilterChips chips={props.chips} onToggle={props.onToggleChip} onOpenFilters={props.onOpenFilters} />
        {body}
      </div>
      {person && mode === 'cards' ? (
        <AboutPanel person={person} photoIndex={photoIndex} setPhotoIndex={setPhotoIndex} actions={props} />
      ) : null}
      {full ? <FullProfile person={full} busy={busy} onClose={() => props.onOpenFullProfile(null)} actions={props} /> : null}
    </div>
  )
}

