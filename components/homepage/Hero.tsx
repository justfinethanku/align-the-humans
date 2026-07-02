import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8">
      {/* Restrained cinematic depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-radial-spotlight opacity-30 dark:opacity-50"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-primary-500/5 blur-3xl dark:bg-primary-500/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-1/4 h-[480px] w-[480px] rounded-full bg-primary-500/5 blur-3xl dark:bg-primary-500/20"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <div className="flex flex-col gap-6 lg:gap-8">
            <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Agree on the hard things.
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                Without the fight.
              </span>
            </h1>
            <p className="max-w-prose text-lg leading-relaxed text-muted-foreground">
              The biggest decisions — equity, money, the future — usually go to whoever argues hardest. Align the Humans separates the thinking from the fighting: answer independently, let AI find where you already agree, and resolve only the conflicts that actually matter.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 shadow-glow">
                <Link href="/signup">Start your first alignment</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="blurred-spotlight opacity-30 dark:opacity-50" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-glow ring-1 ring-border">
              <Image
                src="/images/hero-cofounders.jpg"
                alt="Two cofounders reaching agreement across a table at night"
                width={1920}
                height={1080}
                priority
                className="aspect-video w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-l from-background/50 via-background/10 to-transparent"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent lg:from-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}