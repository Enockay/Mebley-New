/**
 * Mebley icon set. Two-tone line icons on a 24 px grid with a 1.75 px stroke.
 * The base stroke uses currentColor (coral on a Plum 800 disc by default);
 * the accent layer uses Champagne 400. Replaces the emoji used previously
 * (review issues A5, 4.6).
 *
 * Decorative by default (aria-hidden). Pass `title` when the icon carries
 * meaning on its own, e.g. an icon-only button.
 */
import type { ReactNode } from 'react'

export type IconName =
  | 'stitch' | 'mic' | 'waveform' | 'spotlight' | 'moon' | 'globe' | 'target'
  | 'shield' | 'verified' | 'lock' | 'flag' | 'block' | 'checkin' | 'heart'
  | 'pass' | 'message' | 'camera' | 'play' | 'star' | 'language'
  // utility
  | 'playFill' | 'check' | 'plus' | 'menu' | 'close' | 'arrow' | 'chevron' | 'info' | 'users'

const ACCENT = 'var(--champagne-400, #E9C46A)'

const GLYPHS: Record<IconName, { base: ReactNode; accent?: ReactNode }> = {
  stitch: {
    base: <><path d="M4 20 16.5 7.5" /><circle cx="18" cy="6" r="2" /></>,
    accent: <path d="M19.5 7.5c2 2.5.5 5.5-3 5.5s-6.5 2-5 6.5" />,
  },
  mic: {
    base: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
    accent: <path d="M9 21h6" />,
  },
  waveform: {
    base: <path d="M3 10v4M7 7v10M17 8v8M21 10v4" />,
    accent: <path d="M10 4v16M14 6.5v11" />,
  },
  spotlight: {
    base: <circle cx="12" cy="12" r="5.5" />,
    accent: <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />,
  },
  moon: {
    base: <path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z" />,
    accent: <path d="M17 3.5v3M15.5 5h3" />,
  },
  globe: {
    base: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /></>,
    accent: <path d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" />,
  },
  target: {
    base: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /></>,
    accent: <circle cx="12" cy="12" r="1.5" fill={ACCENT} />,
  },
  shield: {
    base: <path d="M12 3 19 6v5.5c0 4.6-3 8.1-7 9.5-4-1.4-7-4.9-7-9.5V6z" />,
    accent: <path d="m9 12 2 2 4-4" />,
  },
  verified: {
    base: <path d="M12 2.8l2.3 1.7 2.8-.1.9 2.7 2.3 1.6-.9 2.7.9 2.7-2.3 1.6-.9 2.7-2.8-.1L12 21.2l-2.3-1.7-2.8.1-.9-2.7-2.3-1.6.9-2.7-.9-2.7 2.3-1.6.9-2.7 2.8.1z" />,
    accent: <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />,
  },
  lock: {
    base: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
    accent: <path d="M12 14.5v2" />,
  },
  flag: {
    base: <path d="M5.5 21V4" />,
    accent: <path d="M5.5 4.5h11l-2.2 4 2.2 4h-11" />,
  },
  block: {
    base: <circle cx="12" cy="12" r="9" />,
    accent: <path d="m5.6 5.6 12.8 12.8" />,
  },
  checkin: {
    base: <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />,
    accent: <circle cx="12" cy="10" r="2.2" />,
  },
  heart: {
    base: <path d="M12 20.5S3 15 3 8.8C3 6 5.2 4 7.8 4c1.8 0 3.3 1 4.2 2.5C12.9 5 14.4 4 16.2 4 18.8 4 21 6 21 8.8 21 15 12 20.5 12 20.5z" />,
    accent: <path d="M7 8.5c.2-1 .9-1.6 1.8-1.7" />,
  },
  pass: {
    base: <circle cx="12" cy="12" r="9" />,
    accent: <path d="m9 9 6 6M15 9l-6 6" />,
  },
  message: {
    base: <path d="M4 5.5h16v11H9.5L5 20v-3.5H4z" />,
    accent: <path d="M8 9.5h8M8 12.5h5" />,
  },
  camera: {
    base: <path d="M3.5 8h4l1.5-2.5h6L16.5 8h4v11h-17z" />,
    accent: <circle cx="12" cy="13" r="3.2" />,
  },
  play: {
    base: <circle cx="12" cy="12" r="9" />,
    accent: <path d="M10 8.5v7l5.5-3.5z" fill={ACCENT} />,
  },
  star: {
    base: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
    accent: <path d="m12 7.5 1.3 2.8 3 .4" />,
  },
  language: {
    base: <path d="M3.5 5.5h9M8 3.5v2M5 5.5c.8 3.6 3.3 6.4 6.5 7.5M11 5.5c-.8 3.6-3.3 6.4-6.5 7.5" />,
    accent: <path d="m13 20.5 3.8-9 3.7 9M14.3 17.5h5" />,
  },
  playFill: { base: <path d="M8.5 5.5v13l10-6.5z" fill="currentColor" /> },
  check: { base: <path d="m5 12.5 4.5 4.5L19 7.5" /> },
  plus: { base: <path d="M12 5v14M5 12h14" /> },
  menu: { base: <path d="M4 7h16M4 12h16M4 17h16" /> },
  close: { base: <path d="M6 6l12 12M18 6 6 18" /> },
  arrow: { base: <path d="M5 12h14M13 6l6 6-6 6" /> },
  chevron: { base: <path d="m9 6 6 6-6 6" /> },
  info: { base: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.5" /></> },
  users: {
    base: <><circle cx="9" cy="8.5" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></>,
    accent: <path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.4c2 .8 3.5 2.9 3.5 5.6" />,
  },
}

type Props = {
  name: IconName
  size?: number
  title?: string
  /** Render the accent layer in currentColor instead of champagne. */
  mono?: boolean
  className?: string
  strokeWidth?: number
}

export default function Icon({ name, size = 24, title, mono = false, className, strokeWidth = 1.75 }: Props) {
  const g = GLYPHS[name]
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {g.base}
      {g.accent ? <g stroke={mono ? 'currentColor' : ACCENT}>{g.accent}</g> : null}
    </svg>
  )
}
