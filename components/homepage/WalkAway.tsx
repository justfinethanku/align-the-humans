import Image from 'next/image'

import { PlateText } from '@/components/site/PlateText'

export function WalkAway() {
  return (
    <section className="border-t border-rule px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          {/* Starts in register, then drifts apart and stays there. */}
          <PlateText
            as="h2"
            className="type-heading text-4xl sm:text-5xl"
            from={0}
            to={3}
            trigger="view"
            delayMs={500}
          >
            Sometimes the right answer is &ldquo;not like this.&rdquo;
          </PlateText>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-ink-soft">
            Finding out you want different things is a good result. It&apos;s far better to learn it
            now, while you&apos;re still friends and nothing is signed, than two years and a client
            list later.
          </p>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-soft">
            We don&apos;t score success by how many conflicts disappear. We measure it by whether
            you both know what you&apos;re agreeing to, or why you shouldn&apos;t.
          </p>
        </div>
        <Image
          src="/images/parting-as-friends.jpg"
          alt="Two people shaking hands on a city sidewalk as they part ways on good terms"
          width={1800}
          height={1200}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[3/2] w-full object-cover"
        />
      </div>
    </section>
  )
}
