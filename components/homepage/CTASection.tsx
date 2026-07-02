import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Background gradient with visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/15 via-accent-600/8 to-primary-50/50 dark:from-primary-500/30 dark:via-accent-500/20 dark:to-transparent" />
      <div className="absolute inset-0 bg-grid-dots [background-size:24px_24px] opacity-15 dark:opacity-20" />
      <div className="blurred-spotlight" />

      {/* Animated glow effect */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-3xl animate-pulse-ring pointer-events-none" />

      {/* Content container */}
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Heading */}
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Have the conversation that actually works.
          </h2>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Free to start. Your partner joins with a link. No credit card.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA */}
            <Button
              asChild
              size="lg"
              className="group relative h-14 px-8 text-lg font-semibold bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-primary-foreground shadow-lg shadow-primary-600/25 dark:shadow-primary-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary-600/40 dark:hover:shadow-primary-500/50"
            >
              <Link href="/signup">
                <span className="relative z-10 flex items-center gap-2">
                  Start your first alignment
                  <svg
                    className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </Link>
            </Button>

            {/* Secondary CTA */}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold border-2 border-primary-600/80 dark:border-primary-500 text-primary-700 dark:text-primary-400 bg-background/60 dark:bg-transparent hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all duration-300 hover:scale-105"
            >
              <Link href="/login">
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}