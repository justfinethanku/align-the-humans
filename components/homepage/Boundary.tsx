import { PILOT_OFFER } from '@/app/lib/monetization'

const included = [
  'A separate question set for each partner, built around your situation',
  'An AI comparison: agreements, differences, unspoken assumptions, and skipped topics',
  'Guided rounds to work through what differs',
  'A shared partnership brief you both review and confirm, with a PDF copy',
]

export function Boundary() {
  return (
    <section className="border-t border-rule px-5 py-24 sm:px-8 lg:py-32" aria-labelledby="boundary-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="boundary-heading" className="type-heading max-w-[20ch] text-4xl text-ink sm:text-5xl">
          The step before the lawyer, not a replacement for one.
        </h2>

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h3 className="flex items-center gap-3 text-lg font-semibold text-ink">
              <span className="h-[3px] w-8 bg-plate-a" aria-hidden="true" />
              What you get
            </h3>
            <ul className="mt-6 space-y-4">
              {included.map((item) => (
                <li key={item} className="border-t border-rule pt-4 leading-relaxed text-ink">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="flex items-center gap-3 text-lg font-semibold text-ink">
              <span className="h-[3px] w-8 bg-plate-b" aria-hidden="true" />
              What it isn&apos;t
            </h3>
            <ul className="mt-6 space-y-4">
              {PILOT_OFFER.excludes.map((item) => (
                <li key={item} className="border-t border-rule pt-4 leading-relaxed text-ink-soft">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
