import type { Metadata } from 'next'
import Link from 'next/link'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { PlateText } from '@/components/site/PlateText'
import { RegistrationMark } from '@/components/site/RegistrationMark'

export const metadata: Metadata = {
  title: 'Example: two agency partners work out their terms',
  description:
    'A complete sample partnership alignment: what two studio co-founders each answered, what the comparison found, how they worked through the differences, and the brief they took to their lawyer.',
  alternates: { canonical: '/example' },
}

// Sample content. The people and the studio are fictional.
const PARTNERS = {
  a: { name: 'Priya', role: 'runs design and production' },
  b: { name: 'Marcus', role: 'runs clients and new business' },
}

const ANSWERS = [
  {
    topic: 'Ownership',
    a: 'Even split. We’re equals.',
    b: 'Even split. We’re equals.',
  },
  {
    topic: 'Paying ourselves',
    a: 'A monthly draw from day one. I have a mortgage.',
    b: 'No draws until we have six months of runway. Profit split at year end.',
  },
  {
    topic: 'Clients we bring in',
    a: 'Every client is a studio client from the day we sign.',
    b: 'My two current retainers stay mine until they renew. New work is the studio’s.',
  },
  {
    topic: 'Time commitment',
    a: 'Full time, around 45 hours a week.',
    b: 'Full time, though I’m finishing one outside contract through March.',
  },
  {
    topic: 'Spending decisions',
    a: 'Either of us can approve anything under $5,000.',
    b: 'Anything over $2,500 needs both of us.',
  },
  {
    topic: 'If one of us leaves',
    a: 'The other buys out their share at an agreed valuation.',
    b: 'The other buys out their share at an agreed valuation.',
  },
]

const FINDINGS = {
  agreed: [
    'An even ownership split, with both partners treated as equals',
    'Both work on the studio full time',
    'A buyout at an agreed valuation if either partner leaves',
  ],
  differences: [
    'When the partners start getting paid, and how much',
    'Whether Marcus’s existing retainers belong to the studio',
    'The spending limit either partner can approve alone',
  ],
  assumptions: [
    'Priya assumes Marcus is fully available from day one. Marcus is planning to finish an outside contract first.',
    'Both assume “even split” settles compensation. Their answers show it doesn’t.',
  ],
  skipped: [
    'Who owns the templates and design systems each partner built before the studio',
    'What happens to the studio name and portfolio if the partnership ends',
  ],
}

const DECISIONS = [
  {
    topic: 'Paying ourselves',
    options: [
      'Monthly draw from day one',
      'No draws until six months of runway',
      'A smaller equal draw once three months of runway is in the bank',
    ],
    chosen:
      'Equal draws of $4,000 a month each, starting once the studio holds three months of operating costs. Remaining profit is split evenly each quarter.',
  },
  {
    topic: 'Existing retainers',
    options: [
      'All clients move to the studio at signing',
      'Retainers stay with Marcus indefinitely',
      'Retainers move over at renewal, with credit for bringing them',
    ],
    chosen:
      'Marcus’s two retainers move to the studio when they renew. For their first year at the studio, Marcus gets 10% of their revenue as an origination credit.',
  },
  {
    topic: 'Spending limit',
    options: ['$5,000 alone', '$2,500 alone', '$3,000 alone, with a shared monthly log'],
    chosen:
      'Either partner can approve up to $3,000. Anything larger needs both. All spending goes in a shared log they review monthly.',
  },
]

const BRIEF_TERMS = [
  ['Ownership', 'Priya and Marcus each own 50% of the studio.'],
  [
    'Compensation',
    'Equal monthly draws of $4,000 each, starting once the studio holds three months of operating costs. Remaining profit is split 50/50 quarterly.',
  ],
  [
    'Client relationships',
    'All new clients belong to the studio. Marcus’s two current retainers move to the studio at renewal, with a 10% origination credit to Marcus for their first year.',
  ],
  [
    'Time commitment',
    'Both partners work on the studio full time. Marcus completes his outside contract by March 31 and takes no new outside work.',
  ],
  ['Spending authority', 'Either partner may approve spending up to $3,000. Larger commitments need both partners.'],
  [
    'Pre-existing work',
    'Each partner keeps ownership of work created before the studio and grants the studio a free license to use it.',
  ],
  [
    'Departure',
    'A departing partner’s share is bought out at a valuation agreed by both partners. The studio name and portfolio stay with the studio.',
  ],
]

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="type-heading max-w-[24ch] text-3xl text-ink sm:text-4xl">
      {children}
    </h2>
  )
}

export default function ExamplePage() {
  return (
    <div className="site min-h-screen">
      <Header />
      <main className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <article className="mx-auto max-w-6xl">
          <p className="text-ink-soft">Sample alignment. The people and the studio are fictional.</p>
          <PlateText as="h1" className="type-display mt-4 max-w-[17ch] text-[clamp(2.5rem,6vw,5.25rem)]" from={12}>
            Two partners, one studio, three surprises.
          </PlateText>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            <span className="font-semibold text-plate-a">{PARTNERS.a.name}</span> {PARTNERS.a.role}.{' '}
            <span className="font-semibold text-plate-b-text">{PARTNERS.b.name}</span> {PARTNERS.b.role}. They
            were merging their freelance work into one design studio and assumed an even split covered it.
            Here&apos;s what happened when they each answered on their own.
          </p>

          {/* 1. Answers */}
          <section className="mt-24 border-t-2 border-ink pt-10" aria-labelledby="answers-heading">
            <SectionHeading id="answers-heading">What they each wrote, separately</SectionHeading>
            <div className="mt-10 hidden grid-cols-[12rem_1fr_1fr] gap-8 pb-3 text-sm font-semibold md:grid">
              <span />
              <span className="flex items-center gap-2 text-plate-a">
                <span className="size-2.5 rounded-full bg-plate-a" aria-hidden="true" />
                {PARTNERS.a.name}
              </span>
              <span className="flex items-center gap-2 text-plate-b-text">
                <span className="size-2.5 rounded-full bg-plate-b" aria-hidden="true" />
                {PARTNERS.b.name}
              </span>
            </div>
            <dl>
              {ANSWERS.map((row) => (
                <div
                  key={row.topic}
                  className="grid gap-2 border-t border-rule py-5 md:grid-cols-[12rem_1fr_1fr] md:gap-8"
                >
                  <dt className="font-semibold text-ink">{row.topic}</dt>
                  <dd className="text-plate-a">
                    <span className="sr-only">{PARTNERS.a.name}: </span>
                    {row.a}
                  </dd>
                  <dd className="text-plate-b-text">
                    <span className="sr-only">{PARTNERS.b.name}: </span>
                    {row.b}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 2. Comparison */}
          <section className="mt-24 border-t-2 border-ink pt-10" aria-labelledby="findings-heading">
            <SectionHeading id="findings-heading">What the comparison found</SectionHeading>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
              Neither partner saw the other&apos;s answers until both had submitted. Then they saw this
              together.
            </p>
            <div className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
              {[
                { title: 'Where they already agree', items: FINDINGS.agreed },
                { title: 'Where they differ', items: FINDINGS.differences },
                { title: 'Assumptions neither said out loud', items: FINDINGS.assumptions },
                { title: 'Topics they both skipped', items: FINDINGS.skipped },
              ].map((group) => (
                <div key={group.title}>
                  <h3 className="text-lg font-semibold text-ink">{group.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li key={item} className="border-t border-rule pt-3 leading-relaxed text-ink-soft">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Resolution */}
          <section className="mt-24 border-t-2 border-ink pt-10" aria-labelledby="decisions-heading">
            <SectionHeading id="decisions-heading">How they worked through it</SectionHeading>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
              They took the differences one at a time. For each one they looked at a few options,
              including ones neither of them had proposed, and chose together.
            </p>
            <div className="mt-12 space-y-12">
              {DECISIONS.map((decision) => (
                <div
                  key={decision.topic}
                  className="grid gap-6 border-t border-rule pt-6 lg:grid-cols-[12rem_1fr_1.2fr] lg:gap-10"
                >
                  <h3 className="font-semibold text-ink">{decision.topic}</h3>
                  <div>
                    <p className="text-sm text-ink-soft">Options they weighed</p>
                    <ul className="mt-2 space-y-1.5 text-ink-soft">
                      {decision.options.map((option) => (
                        <li key={option}>{option}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-ink-soft">What they decided</p>
                    <p className="mt-2 font-medium leading-relaxed text-ink">{decision.chosen}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-12 max-w-2xl leading-relaxed text-ink-soft">
              The two skipped topics went through the same process. They also wrote down two questions
              for their lawyer: which entity type fits the studio, and how to paper the retainer
              transfer.
            </p>
          </section>

          {/* 4. The brief */}
          <section className="mt-24 border-t-2 border-ink pt-10" aria-labelledby="brief-heading">
            <SectionHeading id="brief-heading">The brief they took to their lawyer</SectionHeading>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
              Both partners reviewed the same version and confirmed it. It&apos;s a record of what they
              agreed, written so their lawyer could turn it into the right documents.
            </p>

            <div className="proof mx-auto mt-14 max-w-3xl">
              <div className="bg-white px-6 py-10 shadow-[0_1px_0_#d3d6cd,0_24px_48px_-24px_rgb(26_29_46/0.25)] sm:px-14 sm:py-14">
                <div className="flex items-start justify-between gap-6 border-b border-ink pb-6">
                  <div>
                    <p className="type-heading text-2xl text-ink">Partnership brief</p>
                    <p className="mt-1 text-ink-soft">Kiln Studio, prepared for Priya and Marcus</p>
                  </div>
                  <RegistrationMark size={30} />
                </div>
                <ol className="mt-8 space-y-6">
                  {BRIEF_TERMS.map(([title, body], i) => (
                    <li key={title} className="grid grid-cols-[2rem_1fr] gap-2">
                      <span className="font-semibold text-ink-soft">{i + 1}.</span>
                      <div>
                        <p className="font-semibold text-ink">{title}</p>
                        <p className="mt-1 leading-relaxed text-ink-soft">{body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-10 border-t border-rule pt-6 text-sm leading-relaxed text-ink-soft">
                  This is a record of the partners&apos; shared understanding. It is not legal advice and
                  not a legally binding agreement. Review it with a qualified attorney before relying on
                  it.
                </p>
              </div>
            </div>
          </section>

          {/* 5. The other ending */}
          <section className="mt-24 grid gap-10 border-t-2 border-ink pt-10 lg:grid-cols-2" aria-labelledby="other-ending-heading">
            <SectionHeading id="other-ending-heading">The other way this could have ended</SectionHeading>
            <div className="space-y-4 text-lg leading-relaxed text-ink-soft">
              <p>
                Suppose Marcus wouldn&apos;t move on the retainers, and Priya couldn&apos;t go six months
                without pay. They&apos;d have learned that before they signed a lease or hired anyone.
              </p>
              <p>
                They might keep freelancing and send each other work. That&apos;s a good outcome too. They
                found the problem while it was still cheap.
              </p>
            </div>
          </section>

          <section className="mt-24 border-t-2 border-ink pt-10">
            <p className="type-heading max-w-[22ch] text-3xl text-ink sm:text-4xl">
              Find out what you and your partner are actually agreeing to.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-ink">
                Start your partnership alignment
              </Link>
              <Link href="/pricing" className="btn-paper">
                See pricing
              </Link>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
