export const FAQ_ITEMS = [
  {
    question: 'Is this legal advice?',
    answer:
      'No. We’re not a law firm. You get a clear record of the business terms you both decided on, organized so your lawyer can turn it into the right legal documents.',
  },
  {
    question: 'Can my partner see my answers while I’m writing them?',
    answer:
      'No. Neither of you sees the other’s answers until you’ve both submitted. Then you see the comparison together.',
  },
  {
    question: 'Does the AI decide for us?',
    answer:
      'No. It compares your answers, points out differences and unstated assumptions, and suggests options. The two of you make every decision.',
  },
  {
    question: 'What if we can’t agree?',
    answer:
      'Then you’ll know exactly where and why, before you’ve signed anything or split any money. Deciding not to partner on these terms is a good outcome too.',
  },
  {
    question: 'Does my partner have to pay?',
    answer:
      'No. One price covers the pair. Your partner joins through your invite link and creates a free account to answer.',
  },
  {
    question: 'Who is it for?',
    answer:
      'Two business partners: people starting a company together, bringing someone into an existing one, or changing how they already split the work and the money. Right now it’s built for two people at a time.',
  },
] as const

export function FAQ() {
  return (
    <section className="border-t border-rule px-5 py-24 sm:px-8 lg:py-32" aria-labelledby="faq-heading">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        <h2 id="faq-heading" className="type-heading text-4xl text-ink sm:text-5xl">
          Questions partners ask first
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="py-6">
              <dt className="text-lg font-semibold text-ink">{item.question}</dt>
              <dd className="mt-2 max-w-prose leading-relaxed text-ink-soft">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
