'use client'

import { CheckCircle2, Users, Sparkles, MessageSquare, BarChart3, Handshake } from 'lucide-react'

interface Step {
  number: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Scope',
    description: 'What decision needs to be made? Choose your decision type or describe your own situation. Works for household logistics or business strategy.',
    icon: Users,
  },
  {
    number: 2,
    title: 'Surface',
    description: 'AI identifies what actually matters for YOUR specific decision. Whether it\'s chore fairness or equity philosophy, the questions adapt to what you need to align on.',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Consider',
    description: 'Each person thinks independently without real-time negotiation pressure. Articulate what matters to you before collaborative synthesis begins.',
    icon: MessageSquare,
  },
  {
    number: 4,
    title: 'Synthesize',
    description: 'AI reveals patterns neither person would see alone. Discover shared priorities, underlying motivations, and possibilities you hadn\'t imagined.',
    icon: BarChart3,
  },
  {
    number: 5,
    title: 'Decide',
    description: 'Co-create the solution with complete clarity on what matters to each person. Generate agreements built on mutual understanding, not compromise.',
    icon: Handshake,
  },
]

export function FlowVisualization() {
  return (
    <section className="w-full bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          How It Works: Structure for Any Decision
        </h2>

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
