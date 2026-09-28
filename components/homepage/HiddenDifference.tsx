import { FiftyFifty } from '@/components/site/motion/FiftyFifty'

export function HiddenDifference() {
  return (
    <section className="bg-paper-deep" aria-labelledby="hidden-difference-heading">
      <div className="mx-auto max-w-6xl px-5 pt-24 sm:px-8 lg:pt-32">
        <h2 id="hidden-difference-heading" className="type-heading max-w-[20ch] text-4xl text-ink sm:text-5xl">
          The expensive disagreements are the ones nobody says out loud.
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Take two people starting an agency. They agree on an even split, and they both mean it.
          Then look at what each of them assumed came with it.
        </p>
      </div>
      <FiftyFifty />
    </section>
  )
}
