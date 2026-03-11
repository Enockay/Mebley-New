interface StitchDividerProps {
  width?: string
  opacity?: number
}

export default function StitchDivider({ width = '100%', opacity = 0.5 }: StitchDividerProps) {
  return (
    <svg
      width={width}
      height="8"
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity, display: 'block' }}
    >
      {/* Running stitch — dashes with tiny cross-stitches */}
      <line
        x1="0" y1="4" x2="200" y2="4"
        stroke="#f43f5e"
        strokeWidth="1"
        strokeDasharray="8 5"
        strokeLinecap="round"
      />
      {/* Cross stitch dots at intervals */}
      {[10, 30, 50, 70, 90, 110, 130, 150, 170, 190].map(x => (
        <g key={x}>
          <line x1={x - 2} y1="2" x2={x + 2} y2="6" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round" />
          <line x1={x + 2} y1="2" x2={x - 2} y2="6" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  )
}
