import type { Metadata } from 'next'
import Link from 'next/link'

import { PILOT_OFFER } from '@/app/lib/monetization'
import { UpgradeInterestButton } from '@/components/monetization/UpgradeInterestButton'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { PlateText } from '@/components/site/PlateText'

export const metadata: Metadata = {
  title: 'Pricing: $299 per pair partnership alignment pilot',
  description:
    'One price covers both business partners: separate question sets, an AI comparison of your expectations, guided resolution rounds, and a shared brief for your lawyer.',
  alternates: { canonical: '/pricing' },
}

const steps = [
  'Request a pilot spot below. You’ll need a free account.',
  'We confirm the details and the price with you before anything is charged.',
  'You invite your partner, and you each answer on your own.',
]

export default function PricingPage() {
  return (
    <div className="site min-h-screen">
      <Header />
      <main className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <PlateText as="h1" className="type-display max-w-[24ch] text-[clamp(2.5rem,6.4vw,5.5rem)]" from={12}>
            One price for the pair.
          </PlateText>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            We&apos;re running a paid pilot with business partners who have a real decision in
            front of them. Here&apos;s exactly what it costs and what you get.
          </p>

          <section
            className="mt-16 grid gap-12 border-t-2 border-ink pt-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-20"
            aria-labelledby="offer-heading"
          >
            <div>
              <h2 id="offer-heading" className="type-heading text-2xl text-ink">
                {PILOT_OFFER.name}
              </h2>
              <p className="mt-6">
                <span className="type-display block text-7xl text-ink">{PILOT_OFFER.price}</span>
                <span className="mt-2 block text-ink-soft">{PILOT_OFFER.cadence}, one partnership alignment</span>
              </p>
              <UpgradeInterestButton
                tier={PILOT_OFFER.id}
                context="pricing_page"
                className="btn-ink mt-8 w-full"
              />
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{PILOT_OFFER.billingNote}</p>
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-3 font-semibold text-ink">
                  <span className="h-[3px] w-8 bg-plate-a" aria-hidden="true" />
                  Included
                </h3>
                <ul className="mt-5 space-y-3">
                  {PILOT_OFFER.features.map((feature) => (
                    <li key={feature} className="border-t border-rule pt-3 leading-relaxed text-ink">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-3 font-semibold text-ink">
                  <span className="h-[3px] w-8 bg-plate-b" aria-hidden="true" />
                  Not included
                </h3>
                <ul className="mt-5 space-y-3">
                  {PILOT_OFFER.excludes.map((item) => (
                    <li key={item} className="border-t border-rule pt-3 leading-relaxed text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>

                <h3 className="mt-12 font-semibold text-ink">How the pilot works</h3>
                <ol className="mt-5 space-y-3">
                  {steps.map((step, i) => (
                    <li key={step} className="grid grid-cols-[1.75rem_1fr] border-t border-rule pt-3 leading-relaxed text-ink">
                      <span className="font-semibold text-plate-a">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <p className="mt-20 max-w-2xl leading-relaxed text-ink-soft">
            Want to see the output first?{' '}
            <Link href="/example" className="link-ink text-ink">
              Read a full example alignment
            </Link>{' '}
            between two agency partners, from their separate answers to the brief they took to their
            lawyer.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
