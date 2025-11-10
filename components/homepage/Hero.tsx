import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative flex w-full items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">

          {/* Left Column - Text Content */}
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
              Human<br/>Alignment
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Structure for every decision that matters - from splitting chores to splitting equity
            </p>
            <Button
              asChild
              className="flex h-12 w-fit items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 text-base font-semibold text-white shadow-glow transition-all hover:bg-primary-600 hover:shadow-glow-lg"
            >
              <Link href="/signup">
                <span>Start Free Alignment</span>
              </Link>
            </Button>
          </div>

          {/* Right Column - Particle Visualization */}
          <div className="flex items-center justify-center">
            <div className="particle-container relative aspect-square w-full max-w-md rounded-2xl border border-primary-500/30 p-8">
              {/* Simulated particle network */}
              <svg viewBox="0 0 300 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Connection lines */}
                <g opacity="0.3" stroke="rgb(16, 185, 129)" strokeWidth="1" fill="none">
                  <line x1="150" y1="150" x2="80" y2="80"/>
                  <line x1="150" y1="150" x2="220" y2="80"/>
                  <line x1="150" y1="150" x2="80" y2="220"/>
                  <line x1="150" y1="150" x2="220" y2="220"/>
                  <line x1="80" y1="80" x2="220" y2="80"/>
                  <line x1="80" y1="220" x2="220" y2="220"/>
                  <line x1="80" y1="80" x2="80" y2="220"/>
                  <line x1="220" y1="80" x2="220" y2="220"/>
                </g>

                {/* Particles/nodes */}
                <g>
                  {/* Center cluster */}
                  <circle cx="150" cy="150" r="3" fill="rgb(16, 185, 129)" opacity="0.9">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="145" cy="145" r="2" fill="rgb(16, 185, 129)" opacity="0.8"/>
                  <circle cx="155" cy="145" r="2" fill="rgb(16, 185, 129)" opacity="0.8"/>
                  <circle cx="145" cy="155" r="2" fill="rgb(16, 185, 129)" opacity="0.8"/>
                  <circle cx="155" cy="155" r="2" fill="rgb(16, 185, 129)" opacity="0.8"/>

                  {/* Scattered particles */}
                  <circle cx="80" cy="80" r="2.5" fill="rgb(16, 185, 129)" opacity="0.7"/>
                  <circle cx="220" cy="80" r="2.5" fill="rgb(16, 185, 129)" opacity="0.7"/>
                  <circle cx="80" cy="220" r="2.5" fill="rgb(16, 185, 129)" opacity="0.7"/>
                  <circle cx="220" cy="220" r="2.5" fill="rgb(16, 185, 129)" opacity="0.7"/>

                  <circle cx="100" cy="100" r="1.5" fill="rgb(16, 185, 129)" opacity="0.6"/>
                  <circle cx="200" cy="100" r="1.5" fill="rgb(16, 185, 129)" opacity="0.6"/>
                  <circle cx="100" cy="200" r="1.5" fill="rgb(16, 185, 129)" opacity="0.6"/>
                  <circle cx="200" cy="200" r="1.5" fill="rgb(16, 185, 129)" opacity="0.6"/>

                  <circle cx="120" cy="130" r="1.5" fill="rgb(16, 185, 129)" opacity="0.5"/>
                  <circle cx="180" cy="130" r="1.5" fill="rgb(16, 185, 129)" opacity="0.5"/>
                  <circle cx="120" cy="170" r="1.5" fill="rgb(16, 185, 129)" opacity="0.5"/>
                  <circle cx="180" cy="170" r="1.5" fill="rgb(16, 185, 129)" opacity="0.5"/>

                  {/* More scattered particles */}
                  <circle cx="60" cy="150" r="1" fill="rgb(16, 185, 129)" opacity="0.4"/>
                  <circle cx="240" cy="150" r="1" fill="rgb(16, 185, 129)" opacity="0.4"/>
                  <circle cx="150" cy="60" r="1" fill="rgb(16, 185, 129)" opacity="0.4"/>
                  <circle cx="150" cy="240" r="1" fill="rgb(16, 185, 129)" opacity="0.4"/>
                </g>
              </svg>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
