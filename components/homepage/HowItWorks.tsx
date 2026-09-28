import Image from 'next/image'

export const HOW_IT_WORKS_STEPS = [
  {
    title: 'Each of you answers alone',
    body: 'Questions built for your situation: ownership, pay, roles, decisions, clients, IP, and exits. Your partner can’t see your answers until you’ve both submitted.',
  },
  {
    title: 'See the comparison',
    body: 'Where you agree, where you differ, and the assumptions neither of you said out loud. Topics you both skipped get flagged too.',
  },
  {
    title: 'Work through the differences',
    body: 'Focused rounds on what actually differs, with options beyond splitting the difference. Each round is saved, so you can see what changed.',
  },
  {
    title: 'Take the brief to your lawyer',
    body: 'A plain-language record of what you both decided, which you each review and confirm. Your lawyer turns it into the legal documents you need.',
  },
] as const

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-t border-rule px-5 py-24 sm:px-8 lg:py-32"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
        <div>
          <h2 id="how-heading" className="type-heading max-w-[18ch] text-4xl text-ink sm:text-5xl">
            Four steps, both of you, one shared brief.
          </h2>

          <ol className="mt-14 space-y-12">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[3.5rem_1fr] gap-4 sm:grid-cols-[5rem_1fr]">
                <span
                  className="type-display relative isolate text-5xl leading-none sm:text-6xl"
                  aria-hidden="true"
                >
                  <span className="text-plate-a mix-blend-multiply">{i + 1}</span>
                  <span className="absolute left-[3px] top-[1px] text-plate-b mix-blend-multiply">{i + 1}</span>
                </span>
                <div>
                  <h3 className="type-heading text-xl text-ink sm:text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-prose leading-relaxed text-ink-soft">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <figure className="self-end">
          <div className="proof">
            <Image
              src="/images/brief-for-counsel.jpg"
              alt="A printed partnership brief on a lawyer's desk with a pen and reading glasses"
              width={1800}
              height={1200}
              sizes="(min-width: 1024px) 26rem, 100vw"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          <figcaption className="mt-5 text-sm leading-relaxed text-ink-soft">
            You arrive with decisions and open questions already organized, instead of paying to
            sort them out in the meeting.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
