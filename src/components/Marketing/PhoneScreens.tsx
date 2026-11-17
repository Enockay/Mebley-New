/**
 * Phone frame + sample app screens for the public site (review P1, Phase 3).
 *
 * These are rendered in HTML/CSS from the real product's features so the
 * home page shows what Mebley looks like. They use one consistent sample
 * profile ("Amara") with an illustrative photo. Replace with captures from a
 * production build when available; keep the same frame.
 */
import type { ReactNode } from 'react'
import Icon from './Icon'
import ResponsiveImage from './ResponsiveImage'

const WAVE = [8, 14, 20, 12, 24, 18, 10, 22, 16, 26, 12, 18, 9, 20, 14, 24, 10, 16, 12, 20, 8, 14]

/**
 * `progress` (0 to 1) colours the played part of the note; used by the demo
 * video studio. Without it, the default CSS shows a note part way through.
 */
export function Waveform({ bars = WAVE.length, progress }: { bars?: number; progress?: number }) {
  const played = progress === undefined ? undefined : Math.round(progress * bars)
  return (
    <span className="mk-wave" aria-hidden="true">
      {WAVE.slice(0, bars).map((h, i) => (
        <i
          key={i}
          style={{
            height: `${Math.round((h / 26) * 100)}%`,
            ...(played === undefined ? null : { background: i < played ? 'var(--champagne-400)' : 'rgba(233,196,106,0.35)' }),
          }}
        />
      ))}
    </span>
  )
}

export function VoiceFragment({ label = '0:12 / 0:30' }: { label?: string }) {
  return (
    <div className="mk-frag">
      <span className="mk-frag__play"><Icon name="playFill" size={14} /></span>
      <Waveform />
      <span className="mk-scr-time">{label}</span>
    </div>
  )
}

export function PhoneFrame({
  children,
  size = 'md',
  label,
  caption,
}: {
  children: ReactNode
  size?: 'md' | 'sm'
  /** Accessible description of what the screen shows. */
  label: string
  caption?: string
}) {
  return (
    <figure style={{ margin: 0 }}>
      <div className={`mk-phone${size === 'sm' ? ' mk-phone--sm' : ''}`} role="img" aria-label={label}>
        <div className="mk-phone__notch" />
        <div className="mk-phone__screen" aria-hidden="true">{children}</div>
      </div>
      {caption ? <figcaption className="mk-phone__caption">{caption}</figcaption> : null}
    </figure>
  )
}

/** Discover: a profile with a voice note, a prompt and the Stitch action. */
const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`

export function ProfileScreen({ played }: { played?: number } = {}) {
  return (
    <>
      <div className="mk-scr-photo">
        <ResponsiveImage name="profile-amara" alt="" sizes="300px" priority />
        <span className="mk-scr-match">Shared values: 6</span>
        <div className="mk-scr-id">
          <div className="mk-scr-name">
            Amara, 27
            <span className="mk-scr-verified"><Icon name="verified" size={18} mono /></span>
          </div>
          <div className="mk-scr-city">Nairobi, Kenya · Long term</div>
        </div>
      </div>
      <div className="mk-scr-body">
        <div className="mk-scr-voice">
          <span className="mk-frag__play"><Icon name="playFill" size={12} /></span>
          <Waveform bars={20} progress={played} />
          <span className="mk-scr-time">{played === undefined ? '0:30' : `${clock(played * 30)} / 0:30`}</span>
        </div>
        <div className="mk-scr-prompt">
          <b>A perfect Sunday</b>
          Jazz at the Alliance, then nyama choma with my sisters.
        </div>
        <div className="mk-scr-chips">
          <span>Art</span><span>Travel</span><span>Faith</span><span>Books</span>
        </div>
        <div className="mk-scr-actions">
          <span className="mk-scr-pass"><Icon name="close" size={18} /></span>
          <span className="mk-scr-stitch"><Icon name="stitch" size={16} mono /> Send a Stitch</span>
        </div>
      </div>
    </>
  )
}

/** Step 1: recording the 30 second profile voice note. */
export function RecordScreen({ seconds = 18, full = false }: { seconds?: number; full?: boolean } = {}) {
  return (
    <>
      <div className="mk-scr-top"><b>Your voice note</b></div>
      <div className="mk-scr-pad">
        <div className="mk-scr-hint">Say hello, share what makes you laugh. Up to 30 seconds.</div>
        <div className="mk-scr-rec">
          <span className="mk-scr-rec__btn"><Icon name="mic" size={28} mono /></span>
          <span className="mk-scr-time">Recording {clock(seconds)} / 0:30</span>
          <div className="mk-scr-bar"><span style={{ width: `${(seconds / 30) * 100}%` }} /></div>
        </div>
        <div className="mk-scr-prompt"><b>Prompt</b>My friends would describe me as…</div>
        {full ? (
          <>
            <div className="mk-scr-prompt"><b>Prompt</b>The way to win me over: good coffee and better questions.</div>
            <div className="mk-scr-actions"><span className="mk-scr-stitch">Save voice note</span></div>
          </>
        ) : null}
      </div>
    </>
  )
}

/** Step 2: the Stitch composer, a like with a personal note. */
const STITCH_NOTE = 'Your jazz Sundays sound perfect. Have you been to the Tuesday sessions at the Alchemist?'

/** `chars` reveals the note as if typed; `sent` shows the confirmation state. */
export function StitchScreen({ chars, sent = false, full = false }: { chars?: number; sent?: boolean; full?: boolean } = {}) {
  return (
    <>
      <div className="mk-scr-top">
        <ResponsiveImage name="profile-amara" alt="" sizes="30px" />
        <b>Stitch Amara</b>
      </div>
      <div className="mk-scr-pad">
        <div className="mk-scr-hint">Tell her why you noticed her.</div>
        <div className="mk-scr-field">{chars === undefined ? STITCH_NOTE : STITCH_NOTE.slice(0, chars)}</div>
        <div className="mk-scr-actions">
          <span className="mk-scr-stitch">
            {sent ? <><Icon name="check" size={14} /> Stitch sent</> : <><Icon name="stitch" size={14} mono /> Send Stitch</>}
          </span>
        </div>
        {full ? (
          <>
            <div className="mk-scr-hint" style={{ marginBlockStart: 6 }}>From Amara&rsquo;s profile</div>
            <div className="mk-scr-voice">
              <span className="mk-frag__play"><Icon name="playFill" size={12} /></span>
              <Waveform bars={20} progress={1} />
              <span className="mk-scr-time">0:30</span>
            </div>
            <div className="mk-scr-prompt"><b>A perfect Sunday</b>Jazz at the Alliance, then nyama choma with my sisters.</div>
          </>
        ) : null}
      </div>
    </>
  )
}

/** Step 3: a conversation after a mutual match. */
/** `visible` limits how many messages are shown, for the demo video. */
export function ChatScreen({ visible = 4 }: { visible?: number } = {}) {
  return (
    <>
      <div className="mk-scr-top">
        <ResponsiveImage name="profile-amara" alt="" sizes="30px" />
        <b>Amara</b>
      </div>
      <div className="mk-scr-pad">
        <div className="mk-scr-bubble mk-scr-bubble--stitch mk-scr-bubble--me" style={{ color: 'var(--text-1)' }}>
          <b>Your Stitch</b>Your jazz Sundays sound perfect…
        </div>
        {visible > 1 ? <div className="mk-scr-bubble">Ha, I go every month. Your voice note made me smile.</div> : null}
        {visible > 2 ? (
          <div className="mk-scr-bubble" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="playFill" size={14} /> <Waveform bars={10} />
          </div>
        ) : null}
        {visible > 3 ? <div className="mk-scr-bubble mk-scr-bubble--me">Tuesday at 7?</div> : null}
        {visible > 4 ? <div className="mk-scr-bubble">Perfect. I will save you a seat near the front.</div> : null}
        {visible > 5 ? <div className="mk-scr-bubble mk-scr-bubble--me">Deal. See you there.</div> : null}
      </div>
    </>
  )
}

/** Reasons match src/components/Moderation/BlockReport.tsx. */
const REPORT_REASONS = [
  'Fake profile or impersonation',
  'Inappropriate photos or content',
  'Harassment or threatening behaviour',
  'Spam or scam',
  'Appears to be under 18',
  'Something else',
]

/** Safety: the report and block sheet opened from any chat. `selected` highlights a reason. */
export function ReportScreen({ selected, full = false }: { selected?: number; full?: boolean } = {}) {
  return (
    <>
      <div className="mk-scr-top">
        <ResponsiveImage name="profile-amara" alt="" sizes="30px" />
        <b>Report or block</b>
      </div>
      <div className="mk-scr-pad">
        <div className="mk-scr-hint">What is the issue? Our moderation team reviews every report.</div>
        <div className="mk-scr-list">
          {REPORT_REASONS.map((r, i) => (
            <span key={r} className={i === selected ? 'is-on' : undefined}>
              {r}
              <Icon name={i === selected ? 'check' : 'chevron'} size={14} />
            </span>
          ))}
        </div>
        {full ? <div className="mk-scr-field" style={{ minHeight: 60, color: 'var(--text-3)' }}>Add details (optional)</div> : null}
        <div className="mk-scr-actions">
          <span className="mk-scr-pass" style={{ width: 'auto', flex: 1, borderRadius: 999, gap: 6 }}>
            <Icon name="block" size={16} mono /> Block
          </span>
          <span className="mk-scr-stitch"><Icon name="flag" size={14} mono /> Report</span>
        </div>
      </div>
    </>
  )
}
