import { Briefcase, Users, Home, Handshake } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UseCase {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  ariaLabel: string;
}

const useCases: UseCase[] = [
  {
    icon: Home,
    title: "Household & Everyday",
    description:
      "Fair chore schedules. Weekend plans everyone's excited about. Shared expense splits without resentment. Build the alignment habit with decisions that matter daily.",
    ariaLabel: "Household and everyday decisions use case",
  },
  {
    icon: Users,
    title: "Team & Project Alignment",
    description:
      "Project kickoffs that prevent misalignment. Role clarity before work begins. Strategic priorities that synthesize competing visions. Align early, execute confidently.",
    ariaLabel: "Team and project alignment use case",
  },
  {
    icon: Handshake,
    title: "Major Life Decisions",
    description:
      "Moving decisions with full mutual understanding. Family choices made collaboratively. Living arrangements that respect everyone's needs. Structure for decisions that shape your future.",
    ariaLabel: "Major life decisions use case",
  },
  {
    icon: Briefcase,
    title: "Business Foundations",
    description:
      "Cofounder equity built on explicit shared values. Operating agreements that won't crack under pressure. Partnership terms discovered through collaborative intelligence, not rushed compromise.",
    ariaLabel: "Business foundations use case",
  },
];

export function UseCases() {
  return (
    <section
      className="relative flex w-full items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="use-cases-heading"
    >
      <div className="w-full max-w-6xl">
        <h2
          id="use-cases-heading"
          className="text-3xl font-bold text-center text-white dark:text-white mb-12"
        >
          Any Decision. Any Scale. One Structure.
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card
                key={index}
                className="group rounded-xl bg-surface-dark dark:bg-surface-dark border border-border-subtle dark:border-slate-800/50 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all duration-300 hover:shadow-glow flex flex-col"
                aria-label={useCase.ariaLabel}
                tabIndex={0}
              >
                <CardHeader className="p-6 flex-col items-start gap-4">
                  <div
                    className="flex size-12 items-center justify-center rounded-full bg-primary-500/20 dark:bg-primary-500/20 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <Icon className="w-6 h-6 text-primary-400 dark:text-primary-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-white dark:text-white">
                    {useCase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1">
                  <CardDescription className="text-sm text-text-muted dark:text-slate-400 leading-relaxed">
                    {useCase.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
