import Image from 'next/image'

const situations = [
  {
    title: 'Starting a business together',
    body: 'You’re forming an agency, studio, or practice. Before you split ownership, get clear on pay, roles, clients, and who decides what.',
    image: '/images/starting-together.jpg',
    alt: 'Two new business partners holding coffee in an empty studio they just leased',
  },
  {
    title: 'Bringing someone into the company',
    body: 'A new partner or senior person is joining. Settle equity, pay, authority, and what’s expected of them before their first day.',
    image: '/images/bringing-someone-in.jpg',
    alt: 'A firm owner and an incoming partner talking through printed terms at a round table',
  },
  {
    title: 'Changing how you already work',
    body: 'One of you wants to cut back, start taking a salary, or take on more. Revisit the deal before resentment rewrites it.',
    image: '/images/changing-the-deal.jpg',
    alt: 'Two long-time business partners reviewing a spreadsheet at the end of the day',
  },
]

export function Situations() {
  return (
    <section className="border-t border-rule px-5 py-24 sm:px-8 lg:py-32" aria-labelledby="situations-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="situations-heading" className="type-heading max-w-[22ch] text-4xl text-ink sm:text-5xl">
          For business partners with money, ownership, or real work on the line.
        </h2>

        <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-8 lg:gap-12">
          {situations.map((situation, i) => (
            <article key={situation.title} className={i === 1 ? 'md:mt-24' : i === 2 ? 'md:mt-12' : undefined}>
              <Image
                src={situation.image}
                alt={situation.alt}
                width={1200}
                height={1600}
                sizes="(min-width: 768px) 33vw, 100vw"
                className="aspect-[4/5] w-full object-cover"
              />
              <h3 className="type-heading mt-6 text-xl text-ink sm:text-2xl">{situation.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{situation.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
