'use client'
/**
 * Compositions for the store screenshots and the demo video. See page.tsx.
 * The video is deterministic: every frame is a pure function of time `t`,
 * which the render script sets through window.__seek(t) before each capture.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { LogoMark } from '@/components/Marketing/Logo'
import Icon from '@/components/Marketing/Icon'
import {
  ChatScreen, PhoneFrame, ProfileScreen, RecordScreen, ReportScreen, StitchScreen,
} from '@/components/Marketing/PhoneScreens'
import './studio.css'

declare global {
  interface Window { __seek?: (t: number) => Promise<void>; __duration?: number }
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const ease = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x) }

/* ─── Store screenshots ───────────────────────────────────────────────── */

const SHOTS: { label: string; title: string; body: string; screen: ReactNode; aria: string }[] = [
  { label: 'Discover', title: 'Hear them before you match.', body: 'Every profile has a 30 second voice note.', screen: <ProfileScreen played={0.4} />, aria: 'Sample profile with a voice note playing' },
  { label: 'Your profile', title: 'Your voice, your story.', body: 'Record a voice note in your own words.', screen: <RecordScreen full />, aria: 'Recording a voice note' },
  { label: 'Stitch', title: 'Say why you noticed them.', body: 'A Stitch is a like with a personal note.', screen: <StitchScreen full />, aria: 'Writing a Stitch' },
  { label: 'Match', title: 'Talk when it is mutual.', body: 'Text and voice messages, in one place.', screen: <ChatScreen visible={6} />, aria: 'A conversation after a match' },
  { label: 'Safety', title: 'Safety in every chat.', body: 'Selfie verified profiles. Report or block from any chat.', screen: <ReportScreen selected={0} full />, aria: 'The report and block sheet' },
]

function Shot({ n }: { n: number }) {
  const s = SHOTS[n - 1]
  return (
    <div className="mk st-shot" data-ready>
      <div className="st-glow st-glow--a" />
      <div className="st-glow st-glow--b" />
      <div className="st-shot__copy">
        <p className="mk-label" style={{ margin: 0 }}>{s.label}</p>
        <h1 className="st-title">{s.title}</h1>
        <p className="st-body">{s.body}</p>
      </div>
      <div className="st-shot__phone">
        <PhoneFrame label={s.aria}>{s.screen}</PhoneFrame>
      </div>
    </div>
  )
}

/* ─── Demo video ──────────────────────────────────────────────────────── */

type Scene = { id: string; start: number; end: number; label?: string; title?: string; body?: string }

const SCENES: Scene[] = [
  { id: 'intro', start: 0, end: 4 },
  { id: 'profile', start: 4, end: 13, label: 'Discover', title: 'Every profile has a voice.', body: 'Listen to a 30 second voice note before you decide.' },
  { id: 'record', start: 13, end: 22, label: 'Your profile', title: 'Record yours in your own words.', body: 'Up to 30 seconds, with prompts that show the real you.' },
  { id: 'stitch', start: 22, end: 31, label: 'Stitch', title: 'Say why you noticed them.', body: 'A Stitch is a like with a personal note.' },
  { id: 'chat', start: 31, end: 40, label: 'Match', title: 'When it is mutual, talk.', body: 'Text and voice messages in one conversation.' },
  { id: 'safety', start: 40, end: 47, label: 'Safety', title: 'Safety in every chat.', body: 'Selfie verified profiles. Report or block anyone, any time.' },
  { id: 'end', start: 47, end: 53 },
]
const DURATION = SCENES[SCENES.length - 1].end
const STEPS = SCENES.filter(s => s.label)
const STITCH_LEN = 88

/** Fade and lift in over 0.6 s, fade out over the last 0.5 s of a window. */
function fade(t: number, start: number, end: number, lift = 16): CSSProperties {
  const a = Math.min(ease((t - start) / 0.6), ease((end - t) / 0.5))
  return { opacity: a, transform: `translateY(${(1 - ease((t - start) / 0.6)) * lift}px)` }
}

function screenFor(id: string, lt: number) {
  switch (id) {
    case 'profile': return <ProfileScreen played={clamp((lt - 1.2) / 7)} />
    case 'record': return <RecordScreen full seconds={clamp((lt - 0.8) / 7) * 18} />
    case 'stitch': return <StitchScreen chars={Math.floor(clamp((lt - 0.8) / 5.5) * STITCH_LEN)} sent={lt > 7} full />
    case 'chat': return <ChatScreen visible={Math.round(clamp(1 + (lt - 1) / 1.3, 1, 6))} />
    case 'safety': return <ReportScreen full selected={lt > 2.6 ? 0 : undefined} />
    default: return null
  }
}

function Video() {
  const [t, setT] = useState(0)
  useEffect(() => {
    window.__duration = DURATION
    window.__seek = v =>
      new Promise(res => {
        flushSync(() => setT(v))
        requestAnimationFrame(() => res())
      })
    return () => { delete window.__seek }
  }, [])

  const middle = SCENES.filter(s => s.label)
  const phoneIn = ease((t - 4) / 0.8)
  const phoneOut = ease((47 - t) / 0.6)
  const current = middle.find(s => t >= s.start && t < s.end)
  const drift = Math.sin(t / 6) * 40

  return (
    <div className="mk st-stage">
      <div className="st-glow st-glow--a" style={{ transform: `translate(${drift}px, ${-drift / 2}px)` }} />
      <div className="st-glow st-glow--b" style={{ transform: `translate(${-drift}px, ${drift / 2}px)` }} />

      {/* Intro */}
      <div className="st-center" style={fade(t, 0.2, 4)}>
        <LogoMark className="st-mark" />
        <div className="st-wordmark">Mebley</div>
        <p className="st-body st-body--lg">Hear them before you meet them.</p>
      </div>

      {/* Middle scenes: copy on the left, phone on the right */}
      {middle.map(s => (
        <div key={s.id} className="st-copy" style={fade(t, s.start + 0.2, s.end)}>
          <p className="mk-label" style={{ margin: 0 }}>{s.label}</p>
          <h2 className="st-title st-title--video">{s.title}</h2>
          <p className="st-body st-body--lg">{s.body}</p>
        </div>
      ))}

      <div
        className="st-phone"
        style={{ opacity: Math.min(phoneIn, phoneOut), transform: `translateY(${(1 - phoneIn) * 60}px) scale(1.02)` }}
      >
        <PhoneFrame label="Sample Mebley screens">
          {middle.map(s => (
            <div key={s.id} className="st-layer" style={{ opacity: Math.min(ease((t - s.start) / 0.45), s.id === 'safety' ? 1 : ease((s.end - t) / 0.45)) }}>
              {t > s.start - 0.5 && t < s.end + 0.5 ? screenFor(s.id, t - s.start) : null}
            </div>
          ))}
        </PhoneFrame>
      </div>

      <ol className="st-steps" style={{ opacity: Math.min(phoneIn, phoneOut) }}>
        {STEPS.map(s => (
          <li key={s.id} className={current?.id === s.id ? 'is-on' : undefined}>{s.label}</li>
        ))}
      </ol>

      {/* End card */}
      <div className="st-center" style={fade(t, 47.4, 60)}>
        <LogoMark className="st-mark" />
        <h2 className="st-title st-title--end">Find your <span className="mk-accent">person.</span></h2>
        <p className="st-body st-body--lg">Free to join at mebley.com</p>
        <span className="mk-btn mk-btn--primary" style={{ pointerEvents: 'none' }}>
          Join free <Icon name="arrow" size={20} />
        </span>
        <p className="st-note">Sample screens. Photo is illustrative.</p>
      </div>
    </div>
  )
}

export default function Studio({ mode, shot = 1 }: { mode: 'shot' | 'video'; shot?: number }) {
  return mode === 'video' ? <Video /> : <Shot n={shot} />
}
