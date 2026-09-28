import Link from 'next/link'

import { PILOT_OFFER } from '@/app/lib/monetization'
import { RegistrationMark } from '@/components/site/RegistrationMark'

export function PilotCTA() {
  return (
    <section className="bg-ink px-5 py-24 text-paper [--btn-bg:#1a1d2e] [--btn-fg:#f3f4f0] [--plate-a:#6f8ff5] [--plate-b:#ff7a5c] sm:px-8 lg:py-32" aria-labelledby="pilot-heading">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 id="pilot-heading" className="type-display text-[clamp(2.5rem,6vw,5rem)]">
            Find out what you&apos;re agreeing to.
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper/75">
            {PILOT_OFFER.description} {PILOT_OFFER.billingNote}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="btn-ink [--btn-bg:#f3f4f0] [--btn-fg:#1a1d2e]">
              Start your partnership alignment
            </Link>
            <Link href="/example" className="btn-paper">
              See an example
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-5 lg:flex-col lg:items-end lg:gap-3">
          <RegistrationMark size={56} blend="screen" />
          <p className="lg:text-right">
            <span className="type-display block text-5xl sm:text-6xl">{PILOT_OFFER.price}</span>
            <span className="mt-1 block text-paper/75">{PILOT_OFFER.cadence}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
