import { Metadata } from 'next';
import { Hero } from '@/components/homepage/Hero';
import { FlowVisualization } from '@/components/homepage/FlowVisualization';
import { StatsSection } from '@/components/homepage/StatsSection';
import { UseCases } from '@/components/homepage/UseCases';
import Testimonials from '@/components/homepage/Testimonials';
import { CTASection } from '@/components/homepage/CTASection';
import { Header } from '@/components/layout/Header';

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
      <Header />
      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex items-center">
          <Hero />
        </section>

        {/* About Section - Brief explanation */}
        <section id="about" className="w-full bg-surface-dark py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              What is Human Alignment?
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-4">
              Human Alignment uses AI to facilitate structured conversations between partners,
              helping you work through disagreements systematically and reach mutual understanding.
            </p>
            <p className="text-lg text-slate-400 leading-relaxed">
              Whether you&apos;re cofounders negotiating equity, partners making business decisions,
              or couples navigating life choices, our 5-step process guides you from conflict
              to consensus with AI-powered analysis and suggestions.
            </p>
          </div>
        </section>

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
        <footer className="w-full bg-surface-dark border-t border-slate-800 py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-sm">
              © 2025 Human Alignment. All rights reserved.
            </div>
            <nav className="flex gap-6" aria-label="Footer navigation">
              <a
                href="#about"
                className="text-slate-400 hover:text-primary-400 transition-colors text-sm"
              >
                About
              </a>
              <a
                href="#how-it-works"
                className="text-slate-400 hover:text-primary-400 transition-colors text-sm"
              >
                How It Works
              </a>
              <a
                href="#use-cases"
                className="text-slate-400 hover:text-primary-400 transition-colors text-sm"
              >
                Use Cases
              </a>
              <a
                href="#testimonials"
                className="text-slate-400 hover:text-primary-400 transition-colors text-sm"
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
