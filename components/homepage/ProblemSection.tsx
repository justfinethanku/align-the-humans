import Image from 'next/image';

export function ProblemSection() {
  return (
    <section id="about" className="w-full bg-background py-16 px-4 sm:px-6 lg:px-8 scroll-mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image — left on desktop */}
          <div className="relative order-1 lg:order-none">
            <div className="relative overflow-hidden rounded-2xl border border-border">
              <Image
                src="/images/problem-tension.jpg"
                alt="A couple at opposite ends of a table, facing away from each other"
                width={1280}
                height={720}
                className="aspect-video w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-950/15 via-transparent to-slate-900/10 dark:from-sky-950/25 dark:to-slate-900/15"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Text — right on desktop */}
          <div className="flex flex-col gap-6 order-2 lg:order-none">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              The problem
            </p>
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Every hard conversation becomes a negotiation.
            </h2>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed text-muted-foreground">
                Positions harden the moment you sit down. Whoever argues hardest, talks first, or cares least about the relationship walks away with more — and the resentment compounds.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                It isn&apos;t a character flaw. It&apos;s the format. Live conversation rewards tactics, not truth.
              </p>
            </div>
            <p className="text-lg font-medium text-foreground">
              The fix isn&apos;t talking more. It&apos;s thinking apart before you talk at all.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}