'use client'
/**
 * Mobile sticky "Join free" bar that appears once the visitor scrolls past
 * the element with id="hero" (review 4.5). Hidden on desktop via CSS.
 */
import { useEffect, useState } from 'react'

export default function StickyJoin({ targetId = 'hero' }: { targetId?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [targetId])

  return (
    <div className="mk-sticky-join" data-visible={visible} aria-hidden={!visible}>
      <p>Free to join. Takes two minutes.</p>
      <a href="/auth" className="mk-btn mk-btn--primary mk-btn--sm" tabIndex={visible ? 0 : -1}>Join free</a>
    </div>
  )
}
