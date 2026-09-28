import Image from 'next/image'
import Link from 'next/link'

import { PlateText } from '@/components/site/PlateText'

export function Hero() {
  return (
    <section className="px-5 pb-20 pt-32 sm:px-8 sm:pt-40 lg:pb-28">
      <div className="mx-auto max-w-6xl">
        <PlateText
          as="h1"
          className="type-display max-w-[14ch] text-[clamp(2.75rem,7.4vw,6.6rem)]"
          from={14}
          delayMs={250}
        >
          Agree on the partnership before you commit to&nbsp;it.
        </PlateText>

        <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,34rem)_1fr] lg:items-end lg:gap-16">
          <p className="text-lg leading-relaxed text-ink-soft sm:text-xl">
            Work through ownership, money, responsibilities, decisions, and what happens if someone
            leaves. You each answer on your own, find where your expectations differ, and build a
            shared brief to review with your lawyer.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link href="/signup" className="btn-ink">
              Start your partnership alignment
            </Link>
            <Link href="/example" className="btn-paper">
              See an example
            </Link>
          </div>
        </div>

        <figure className="mt-16 sm:mt-20">
          <div className="proof">
            <Image
              src="/images/partners-studio.jpg"
              alt="Two business partners at opposite ends of a long studio worktable, each writing their own answers"
              width={2400}
              height={1200}
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="aspect-[4/3] w-full object-cover sm:aspect-[2/1]"
            />
          </div>
          <figcaption className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">
            Each of you answers on your own. Neither of you sees the other&apos;s answers until you
            both finish, so nobody&apos;s first answer is shaped by the other&apos;s.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
