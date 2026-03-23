export default function CrotchetWordmark({ height = 36 }: { height?: number }) {
  return (
    <span
      style={{
        height,
        lineHeight: `${height}px`,
        display: 'inline-block',
        fontFamily: "'Fraunces', Georgia, serif",
        fontWeight: 700,
        fontSize: Math.max(18, Math.round(height * 0.9)),
        letterSpacing: '-0.01em',
        background: 'linear-gradient(90deg,#e95075 0%,#de5f8c 42%,#cb4faf 100%)',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }}
    >
      Mebley
    </span>
  )
}