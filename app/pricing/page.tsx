import type { Metadata } from 'next'
import { Check, HeartHandshake } from 'lucide-react'

import { MONETIZATION_TIERS } from '@/app/lib/monetization'
import { UpgradeInterestButton } from '@/components/monetization/UpgradeInterestButton'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Pricing | Align the Humans',
  description: 'Start with one complete creator alignment free, then choose access for the agreements you want to keep healthy.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full border border-primary-500/30 bg-primary-500/10">
            <HeartHandshake className="size-6 text-primary-400" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-400">
            One complete alignment free
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
            Pay when you need the next agreement.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Your free run includes questions, analysis, resolution, a signed agreement, PDF export,
            and the first 30-day check-in. Participation through someone else&apos;s invite is always free.
          </p>
        </section>

        <section className="mx-auto mt-14 grid max-w-7xl gap-6 lg:grid-cols-3">
          {MONETIZATION_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className="relative flex border-border/80 bg-card/70 shadow-none backdrop-blur"
            >
              {tier.badge && (
                <span className="absolute right-5 top-5 rounded-full bg-primary-500/15 px-3 py-1 text-xs font-semibold text-primary-400">
                  {tier.badge}
                </span>
              )}
              <div className="flex w-full flex-col">
                <CardHeader className={tier.badge ? 'pr-32' : undefined}>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="flex items-baseline gap-2 pt-3">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">{tier.cadence}</span>
                  </div>
                  <CardDescription className="pt-2">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-8 space-y-3 text-sm text-muted-foreground">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <UpgradeInterestButton
                    tier={tier.id}
                    context="pricing_page"
                    className="mt-auto w-full"
                  />
                </CardContent>
              </div>
            </Card>
          ))}
        </section>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          Billing is not live yet. Early-access requests help us prioritize which option ships first.
        </p>
      </main>
      <Footer />
    </div>
  )
}
