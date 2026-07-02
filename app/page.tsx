import { Metadata } from 'next';
import { Hero } from '@/components/homepage/Hero';
import { ProblemSection } from '@/components/homepage/ProblemSection';
import { FlowVisualization } from '@/components/homepage/FlowVisualization';
import { StatsSection } from '@/components/homepage/StatsSection';
import { UseCases } from '@/components/homepage/UseCases';
import Testimonials from '@/components/homepage/Testimonials';
import { CTASection } from '@/components/homepage/CTASection';
import { Header } from '@/components/layout/Header';
import { WebApplicationSchema } from '@/components/seo/WebApplicationSchema';
import { HowToSchema } from '@/components/seo/HowToSchema';

export const metadata: Metadata = {
  title: 'Human Alignment - Structure for Every Decision That Matters',
  description: 'From household chores to cofounder equity - structured collaboration that turns any decision into clarity. Think independently, align collectively, decide confidently.',
  keywords: ['alignment', 'collaborative decision-making', 'structured thinking', 'partnership decisions', 'team alignment', 'household decisions', 'cofounder agreement', 'AI collaboration'],
  openGraph: {
    title: 'Human Alignment - Structure for Every Decision That Matters',
    description: 'From household chores to cofounder equity - structured collaboration that turns any decision into clarity. Think independently, align collectively, decide confidently.',
    type: 'website',
  },
};

export default function Home() {
  return (
    <>
      <WebApplicationSchema />
      <HowToSchema />
      <Header />
      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex items-center">
          <Hero />
        </section>

        {/* Problem Section */}
        <ProblemSection />

        {/* 5-Step Process */}
        <section id="how-it-works" className="scroll-mt-16">
          <FlowVisualization />
        </section>

        {/* Statistics */}
        <section id="stats" className="scroll-mt-16">
          <StatsSection />
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="scroll-mt-16 bg-surface-dark">
          <UseCases />
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="scroll-mt-16">
          <Testimonials />
        </section>

        {/* Final CTA */}
        <section id="cta" className="scroll-mt-16">
          <CTASection />
        </section>

        {/* Footer */}
        <footer className="w-full bg-surface-dark border-t border-border py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground text-sm">
              © 2025 Human Alignment. All rights reserved.
            </div>
            <nav className="flex gap-6" aria-label="Footer navigation">
              <a
                href="#about"
                className="text-muted-foreground hover:text-primary-400 transition-colors text-sm"
              >
                About
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-primary-400 transition-colors text-sm"
              >
                How It Works
              </a>
              <a
                href="#use-cases"
                className="text-muted-foreground hover:text-primary-400 transition-colors text-sm"
              >
                Use Cases
              </a>
              <a
                href="#testimonials"
                className="text-muted-foreground hover:text-primary-400 transition-colors text-sm"
              >
                Testimonials
              </a>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
