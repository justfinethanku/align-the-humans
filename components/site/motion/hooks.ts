'use client'

import { useEffect, useState, type RefObject } from 'react'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/** True once the element has scrolled into view (never flips back). */
export function useInViewOnce(
  ref: RefObject<Element>,
  { enabled = true, rootMargin = '0px 0px -15% 0px' } = {}
): boolean {
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || seen) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, ref, rootMargin, seen])

  return seen
}

/**
 * Scroll progress (0 → 1) through a tall container whose child is sticky.
 * 0 when the container's top reaches the viewport top, 1 when its bottom
 * reaches the viewport bottom.
 */
export function useStickyProgress(ref: RefObject<HTMLElement>): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      const next = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 1
      setProgress(next)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref])

  return progress
}

/** Map progress within [start, end] to 0 → 1, clamped. */
export function segment(progress: number, start: number, end: number): number {
  if (progress <= start) return 0
  if (progress >= end) return 1
  return (progress - start) / (end - start)
}

/** Smooth ease-out for scroll-driven values. */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
