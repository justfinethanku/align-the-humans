import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Testimonial {
  quote: string
  name: string
  role: string
  company?: string
  initials: string
}

const testimonials: Testimonial[] = [
  {
    quote: "We started using Human Alignment to finally solve our chore schedule wars. It worked so perfectly that we used it again for vacation planning, then budget decisions. When my roommate and I decided to start a business together, this was the obvious tool for our operating agreement. We'd already proven it works at every scale.",
    name: "Sarah Chen",
    role: "Co-Founder & CEO",
    company: "CloudSync AI",
    initials: "SC"
  },
  {
    quote: "After 15 years of marriage, we thought we knew how to communicate. But when it came to deciding whether to relocate for my job, we were stuck in circles. The structured process helped us articulate what really mattered to each of us, and the AI revealed compromises neither of us had thought of. We made the decision together, both feeling completely heard.",
    name: "Marcus Johnson",
    role: "Product Manager",
    company: "Personal",
    initials: "MJ"
  },
  {
    quote: "Our business partnership was on the verge of dissolving over operational disagreements. The AI's analysis was eerily accurate—it identified that our real conflict wasn't about the specifics we were arguing about, but underlying differences in risk tolerance and growth pace. Armed with that insight, we restructured our roles and saved the partnership.",
    name: "Priya Patel",
    role: "Managing Partner",
    company: "Patel & Associates Law",
    initials: "PP"
  },
  {
    quote: "I was skeptical about AI for something as nuanced as partnership decisions, but I was desperate. My co-founder and I were deadlocked on product direction. The platform didn't just help us compromise—it helped us discover a third option that was better than either of our original ideas. That 'Synthesize' phase is genuinely brilliant.",
    name: "David Kim",
    role: "Technical Co-Founder",
    company: "ByteForge Labs",
    initials: "DK"
  }
]

export default function Testimonials() {
  return (
    <section className="relative flex w-full items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          From Small Decisions to Big Ones
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-card border-border p-6 flex flex-col justify-between"
            >
              {/* Quote with visual quote mark */}
              <div className="relative mb-6">
                <svg
                  className="absolute -top-2 -left-2 w-8 h-8 text-primary/20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {testimonial.quote}
                </p>
              </div>

              {/* Author info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-primary/10 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                    {testimonial.company && testimonial.company !== "Personal Use" && (
                      <>, {testimonial.company}</>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
