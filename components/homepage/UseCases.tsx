import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UseCase {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  ariaLabel: string;
}

const useCases: UseCase[] = [
  {
    title: "Cofounders",
    description:
      "Equity splits, roles, and what happens if one of you wants out. Settle it before it settles you.",
    imageSrc: "/images/usecase-cofounders.jpg",
    imageAlt:
      "Two cofounders reviewing an agreement together in a bright daylight office",
    ariaLabel: "Cofounders use case",
  },
  {
    title: "Couples",
    description:
      "Money, moving, family plans — the decisions too big to win and too important to lose.",
    imageSrc: "/images/usecase-couple.jpg",
    imageAlt: "A couple sitting together on a sofa in warm evening light",
    ariaLabel: "Couples use case",
  },
  {
    title: "Roommates",
    description:
      "Rent, chores, guests, and quiet hours. House rules everyone actually agreed to.",
    imageSrc: "/images/usecase-roommates.jpg",
    imageAlt: "Two roommates talking in a shared kitchen",
    ariaLabel: "Roommates use case",
  },
  {
    title: "Teams & partners",
    description:
      "Ownership, priorities, and who decides what. Alignment before the stakes get personal.",
    imageSrc: "/images/usecase-team.jpg",
    imageAlt: "Three colleagues collaborating at a table at dusk",
    ariaLabel: "Teams and partners use case",
  },
];

export function UseCases() {
  return (
    <section
      className="relative flex w-full items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="use-cases-heading"
    >
      <div className="w-full max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Who it&apos;s for
          </p>
          <h2
            id="use-cases-heading"
            className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl"
          >
            Built for the conversations you&apos;ve been putting off.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lg"
              aria-label={useCase.ariaLabel}
              tabIndex={0}
            >
              <div className="relative overflow-hidden">
                <Image
                  src={useCase.imageSrc}
                  alt={useCase.imageAlt}
                  width={1200}
                  height={800}
                  className="aspect-[3/2] w-full object-cover"
                />
              </div>
              <CardHeader className="gap-2 p-5">
                <CardTitle className="font-display text-lg font-semibold text-foreground xl:text-xl">
                  {useCase.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-5 pt-0">
                <CardDescription className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {useCase.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}