'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from './motion/hooks'

interface RegistrationMarkProps {
  size?: number
  /** Start misregistered and settle into register after mount. */
  animate?: boolean
  /** Hold the plates apart (used for the "didn't line up" outcome). */
  offset?: number
  /** multiply on paper; screen on dark backgrounds. */
  blend?: 'multiply' | 'screen'
  className?: string
}

/**
 * The brand mark: a printer's registration target, printed once per plate.
 * Plate A (partner one) and plate B (partner two) multiply to ink when aligned.
 */
export function RegistrationMark({
  size = 28,
  animate = false,
  offset,
  blend = 'multiply',
  className,
}: RegistrationMarkProps) {
  const reduced = useReducedMotion()
  const [settled, setSettled] = useState(!animate)

  useEffect(() => {
    if (!animate) return
    const id = window.setTimeout(() => setSettled(true), 150)
    return () => window.clearTimeout(id)
  }, [animate])

  const shift = offset ?? (settled || reduced ? 0 : 3)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      style={{ isolation: 'isolate', overflow: 'visible' }}
    >
      {[
        { color: 'var(--plate-a)', dx: -shift },
        { color: 'var(--plate-b)', dx: shift },
      ].map((plate, i) => (
        <g
          key={i}
          style={{
            mixBlendMode: blend,
            transform: `translate(${plate.dx}px, ${plate.dx * -0.5}px)`,
            transition: reduced ? undefined : 'transform 900ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          stroke={plate.color}
          strokeWidth={2.2}
          fill="none"
        >
          <circle cx="16" cy="16" r="8.5" />
          <path d="M16 1.5v29M1.5 16h29" />
        </g>
      ))}
    </svg>
  )
}
