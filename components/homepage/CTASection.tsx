import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Background gradient with visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-accent-600/10 to-transparent dark:from-primary-500/30 dark:via-accent-500/20" />
      <div className="absolute inset-0 bg-grid-dots [background-size:24px_24px] opacity-20" />
      <div className="blurred-spotlight" />

      {/* Animated glow effect */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-3xl animate-pulse-ring pointer-events-none" />

      {/* Content container */}
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary dark:text-text-primary mb-6">
            Ready to align?
          </h2>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-text-muted dark:text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            Build the habit with small decisions. Trust it when everything&apos;s on the line. Start your first alignment in under 5 minutes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA - Get Started */}
            <Button
              asChild
              size="lg"
              className="group relative h-14 px-8 text-lg font-semibold bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white shadow-lg shadow-primary-600/30 dark:shadow-primary-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary-600/50 dark:hover:shadow-primary-500/50"
            >
              <Link href="/signup">
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
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

            {/* Secondary CTA - Sign In */}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold border-2 border-primary-600 dark:border-primary-500 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all duration-300 hover:scale-105"
            >
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>

          {/* Trust indicator */}
          <p className="mt-8 text-sm text-text-muted dark:text-text-muted">
            Join 10,000+ users aligning on everything from chores to equity
          </p>
        </div>
      </div>
    </section>
  )
}
