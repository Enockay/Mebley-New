'use client'
/**
 * Demo video that plays by itself while it is on screen and pauses when it
 * scrolls away. Muted and inline so browsers allow autoplay. It does not
 * download until it is near the viewport, and it does not auto-start when the
 * visitor has asked for reduced motion. Controls stay visible so anyone can
 * pause it (WCAG 2.2.2).
 */
import { useEffect, useRef } from 'react'

export default function DemoVideo({ src, poster, describedBy }: { src: string; poster: string; describedBy?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let userPaused = false
    // A pause the visitor makes stays paused; only pauses we cause are resumed.
    let autoPausing = false
    const onPause = () => { if (!autoPausing) userPaused = true }
    const onPlay = () => { userPaused = false }
    v.addEventListener('pause', onPause)
    v.addEventListener('play', onPlay)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!reduce && !userPaused && v.paused) v.play().catch(() => {})
        } else if (!v.paused) {
          autoPausing = true
          v.pause()
          autoPausing = false
        }
      },
      { threshold: [0, 0.5] },
    )
    io.observe(v)
    return () => {
      io.disconnect()
      v.removeEventListener('pause', onPause)
      v.removeEventListener('play', onPlay)
    }
  }, [])

  return (
    <video
      ref={ref}
      className="mk-demo__video"
      controls
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      width={1280}
      height={720}
      aria-describedby={describedBy}
    >
      <source src={src} type="video/webm" />
    </video>
  )
}
