'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { easeOut, segment, useReducedMotion, useStickyProgress } from './hooks'

const ROWS = [
  {
    topic: 'Paying ourselves',
    a: '$6k a month each, before profit',
    b: 'No salaries in year one',
  },
  {
    topic: 'Clients we already have',
    a: 'They become company clients',
    b: 'They stay with whoever brought them',
  },
  {
    topic: 'If one of us cuts back',
    a: 'Ownership stays 50/50',
    b: 'Ownership follows the hours',
  },
] as const

/**
 * Scroll-driven motion piece: two partners' "50/50" slide together and print
 * as one crisp number, then the assumptions underneath print out of register
 * and split apart. Reduced motion renders the finished frame.
 */
export function FiftyFifty() {
  const ref = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLDivElement>(null)
  const restRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState({ number: 0, rest: 0 })
  const reduced = useReducedMotion()

  // Measure the number block (so it can shrink without leaving a gap) and
  // everything below it (so the number can start centered on screen).
  useEffect(() => {
    const number = numberRef.current
    const rest = restRef.current
    if (!number || !rest) return
    const measure = () => setHeights({ number: number.offsetHeight, rest: rest.offsetHeight })
    const observer = new ResizeObserver(measure)
    observer.observe(number)
    observer.observe(rest)
    return () => observer.disconnect()
  }, [])
  const scrolled = useStickyProgress(ref)
  const p = reduced ? 1 : scrolled

  // Phase 1: the two numbers converge into register.
  const converge = easeOut(segment(p, 0.02, 0.24))
  const agreed = segment(p, 0.24, 0.3)
  // Phase 2: the number steps back and the assumptions print.
  const lift = easeOut(segment(p, 0.3, 0.4))
  // Phase 3: the closing line.
  const close = easeOut(segment(p, 0.84, 0.94))

  const numberStyle = (side: -1 | 1): CSSProperties => ({
    transform: `translateX(${side * (1 - converge) * 34}vw)`,
  })

  return (
    <div ref={ref} className={reduced ? 'relative' : 'relative h-[420vh]'}>
      <div
        className={
          reduced
            ? 'relative py-24'
            : 'sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-16'
        }
      >
        <div
          className="mx-auto w-full max-w-6xl px-5 sm:px-8"
          style={reduced ? undefined : { transform: `translateY(${((1 - lift) * heights.rest) / 2}px)` }}
        >
          {/* Who is who */}
          <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-1 text-[0.8rem] text-ink-soft sm:mb-10 sm:gap-y-2 sm:text-sm">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-plate-a" aria-hidden="true" />
              Partner one: &ldquo;Even split. I run production.&rdquo;
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-plate-b" aria-hidden="true" />
              Partner two: &ldquo;Even split. I bring the clients.&rdquo;
            </span>
          </div>

          {/* The number */}
          <div
            ref={numberRef}
            className="relative origin-top-left"
            style={{
              transform: `scale(${1 - lift * 0.5})`,
              marginBottom: `${-lift * 0.5 * heights.number}px`,
            }}
          >
            <p
              className="type-display relative isolate select-none text-[clamp(5.5rem,21vw,17rem)] leading-none"
            >
              <span className="block text-plate-a mix-blend-multiply" style={numberStyle(-1)}>
                50/50
              </span>
              <span
                className="absolute inset-0 block text-plate-b mix-blend-multiply"
                style={numberStyle(1)}
                aria-hidden="true"
              >
                50/50
              </span>
            </p>
            <p
              className="type-heading mt-2 text-2xl text-ink sm:text-3xl"
              style={{ opacity: agreed * (1 - lift * 0.4) }}
            >
              Agreed. Or so they think.
            </p>
          </div>

          <div ref={restRef}>
            {/* The assumptions underneath */}
            <dl className="mt-5 space-y-4 sm:mt-14 sm:space-y-9">
              {ROWS.map((row, i) => {
                const start = 0.4 + i * 0.14
                const show = segment(p, start, start + 0.04)
                const split = easeOut(segment(p, start + 0.05, start + 0.12))
                return (
                  <div
                    key={row.topic}
                    className="grid gap-1 border-t border-rule pt-3 sm:gap-2 sm:pt-4 md:grid-cols-[13rem_1fr]"
                    style={{ opacity: show }}
                  >
                    <dt className="text-sm font-semibold text-ink">{row.topic}</dt>
                    <dd className="relative isolate grid gap-1 text-base font-semibold leading-snug sm:text-2xl md:grid-cols-2 md:gap-8">
                      <span className="text-plate-a mix-blend-multiply">
                        <span className="sr-only">Partner one: </span>
                        {row.a}
                      </span>
                      {/* Starts printed on top of partner one's answer, then slides into its own column. */}
                      <span
                        className="text-plate-b-text mix-blend-multiply [--px:0px] [--py:-100%] md:[--px:calc(-100%-2rem)] md:[--py:0%]"
                        style={
                          {
                            '--t': 1 - split,
                            transform: 'translate(calc(var(--t) * var(--px)), calc(var(--t) * var(--py)))',
                          } as CSSProperties
                        }
                      >
                        <span className="sr-only">Partner two: </span>
                        {row.b}
                      </span>
                    </dd>
                  </div>
                )
              })}
            </dl>

            {/* The turn */}
            <div
              className="mt-8 max-w-2xl sm:mt-16"
              style={{
                opacity: close,
                transform: `translateY(${(1 - close) * 16}px)`,
              }}
            >
              <p className="type-heading text-3xl text-ink sm:text-5xl">Same split. Different deal.</p>
              <p className="mt-3 text-base leading-relaxed text-ink-soft sm:mt-4 sm:text-lg">
                A record that says &ldquo;50/50, agreed&rdquo; misses the part that matters. Align the Humans
                finds these differences while they&apos;re still cheap to talk about.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
