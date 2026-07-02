import { Card } from '@/components/ui/card'
import { Scale, Brain, FileCheck } from 'lucide-react'

interface Reason {
  title: string
  body: string
  icon: React.ComponentType<{ className?: string }>
}

const reasons: Reason[] = [
  {
    title: 'No anchoring',
    body: "The first number spoken shouldn't decide the outcome. Answering apart means both views arrive whole.",
    icon: Scale,
  },
  {
    title: 'A neutral third brain',
    body: "AI facilitates — it doesn't judge, take sides, or get tired. It surfaces agreement you can't see from inside the conflict.",
    icon: Brain,
  },
  {
    title: 'Everything in writing',
    body: 'Every step leaves a record: what you each said, what you resolved, and what you both signed.',
    icon: FileCheck,
  },
]

export function WhyItWorks() {
  return (
    <section
      className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-background"
      aria-label="Why it works"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-primary mb-4">
            Why it works
          </p>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Independent thinking beats live negotiation.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reasons.map((reason) => {
            const Icon = reason.icon
            return (
              <Card
                key={reason.title}
                className="p-8 flex flex-col bg-card border-border"
              >
                <div className="mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Icon
                    className="w-5 h-5 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {reason.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {reason.body}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}