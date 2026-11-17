/**
 * Simplified Mebley mark (review 4.1): a solid coral circle, a solid heart,
 * and a thin champagne sound-wave arc beneath. Wordmark stays in Fraunces.
 * Favicons use the two-shape version without the arc (public/icon.svg).
 */
export function LogoMark({ withWave = true, className }: { withWave?: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={withWave ? '0 0 64 76' : '0 0 64 64'}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy={withWave ? 30 : 32} r={withWave ? 28 : 31} fill="#E8355F" />
      <path
        transform={withWave ? 'translate(15.5 13) scale(1.375)' : 'translate(14 14) scale(1.5)'}
        fill="#0C0A1E"
        d="M12 20.5S3 15 3 8.8C3 6 5.2 4 7.8 4c1.8 0 3.3 1 4.2 2.5C12.9 5 14.4 4 16.2 4 18.8 4 21 6 21 8.8 21 15 12 20.5 12 20.5z"
      />
      {withWave ? (
        <path d="M10 68q5.5-5 11 0t11 0 11 0 11 0" fill="none" stroke="#E9C46A" strokeWidth="3" strokeLinecap="round" />
      ) : null}
    </svg>
  )
}

export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <a href={href} className="mk-logo" aria-label="Mebley home">
      <LogoMark />
      <span aria-hidden="true">Mebley</span>
    </a>
  )
}
