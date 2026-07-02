import { Metadata } from 'next';
import { Hero } from '@/components/homepage/Hero';
import { ProblemSection } from '@/components/homepage/ProblemSection';
import { FlowVisualization } from '@/components/homepage/FlowVisualization';
import { WhyItWorks } from '@/components/homepage/WhyItWorks';
import { UseCases } from '@/components/homepage/UseCases';
import { CTASection } from '@/components/homepage/CTASection';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { WebApplicationSchema } from '@/components/seo/WebApplicationSchema';
import { HowToSchema } from '@/components/seo/HowToSchema';

export const metadata: Metadata = {
  title: 'Align the Humans - Agree on the Hard Things, Without the Fight',
  description: 'Answer independently, let AI find where you already agree, and resolve only the conflicts that actually matter - from cofounder equity to household decisions.',
  keywords: ['alignment', 'collaborative decision-making', 'structured thinking', 'partnership decisions', 'team alignment', 'household decisions', 'cofounder agreement', 'AI collaboration'],
  openGraph: {
    title: 'Align the Humans - Agree on the Hard Things, Without the Fight',
    description: 'Answer independently, let AI find where you already agree, and resolve only the conflicts that actually matter - from cofounder equity to household decisions.',
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

        {/* Why it works */}
        <section id="why" className="scroll-mt-16">
          <WhyItWorks />
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="scroll-mt-16 bg-surface-dark">
          <UseCases />
        </section>

        {/* Final CTA */}
        <section id="cta" className="scroll-mt-16">
          <CTASection />
        </section>

        <Footer />
      </main>
    </>
  );
}
