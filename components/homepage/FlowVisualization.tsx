'use client'

import { PenLine, CheckCheck, Scale, GitMerge, FileSignature } from 'lucide-react'

interface Step {
  number: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Answer alone',
    description: 'Each of you answers the same hard questions independently. No anchoring, no performing, no pressure.',
    icon: PenLine,
  },
  {
    number: 2,
    title: 'See where you already agree',
    description: 'AI compares both sides and shows your common ground first — it\'s almost always more than you feared.',
    icon: CheckCheck,
  },
  {
    number: 3,
    title: 'Name the real conflicts',
    description: 'The genuine disagreements get named precisely, ranked by what actually matters.',
    icon: Scale,
  },
  {
    number: 4,
    title: 'Resolve what matters',
    description: 'Work through only the few conflicts that count, with AI suggesting fair middle ground.',
    icon: GitMerge,
  },
  {
    number: 5,
    title: 'Sign it',
    description: 'Walk away with a written agreement you both believe in — and the relationship intact.',
    icon: FileSignature,
  },
]

export function FlowVisualization() {
  return (
    <section className="w-full bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Think alone. Align together.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Five steps from dread to a signed agreement.
          </p>
        </div>

        {/* Desktop/Tablet: Horizontal Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="relative flex flex-col items-start space-y-3"
              >
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%+0.5rem)] w-4 h-0.5 bg-primary/20" />
                )}

                {/* Icon Container */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/20">
                  <Icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {step.number}.
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile: Vertical List */}
        <div className="md:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative flex gap-4">
                {/* Left Side: Icon and Connecting Line */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/20 shrink-0">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>

                  {/* Vertical Connecting Line */}
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full min-h-12 bg-primary/20 mt-3" />
                  )}
                </div>

                {/* Right Side: Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm font-semibold text-primary">
                      {step.number}.
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}