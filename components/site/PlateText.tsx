'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useInViewOnce, useReducedMotion } from './motion/hooks'

type Trigger = 'mount' | 'view' | 'none'

interface PlateTextProps {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'
  className?: string
  /** Misregistration in px before settling. Plate A goes left/up, plate B right/down. */
  from?: number
  /** Offset to hold after settling. 0 = in register. */
  to?: number
  trigger?: Trigger
  delayMs?: number
}

/**
 * Type printed twice — once in each partner's ink — and multiplied together.
 * It starts out of register and settles into crisp ink.
 */
export function PlateText({
  children,
  as: Tag = 'span',
  className,
  from = 10,
  to = 0,
  trigger = 'mount',
  delayMs = 200,
}: PlateTextProps) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const inView = useInViewOnce(ref, { enabled: trigger === 'view' })
  const [settled, setSettled] = useState(trigger === 'none')

  const ready = trigger === 'mount' || (trigger === 'view' && inView)

  useEffect(() => {
    if (!ready || settled) return
    const id = window.setTimeout(() => setSettled(true), delayMs)
    return () => window.clearTimeout(id)
  }, [ready, settled, delayMs])

  const d = reduced || settled ? to : from
  const style = {
    '--ax': `${-d}px`,
    '--ay': `${-d * 0.35}px`,
    '--bx': `${d}px`,
    '--by': `${d * 0.35}px`,
  } as CSSProperties

  return (
    <Tag ref={ref as never} className={`plate-stack ${className ?? ''}`} style={style}>
      <span className="plate plate-a">{children}</span>
      <span className="plate plate-b" aria-hidden="true">
        {children}
      </span>
    </Tag>
  )
}
