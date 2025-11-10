'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/95 backdrop-blur-sm border-b border-slate-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-xl font-bold text-white hover:text-primary-400 transition-colors"
              aria-label="Human Alignment home"
            >
              Human<span className="text-primary-500">Alignment</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#about"
              className="text-sm text-slate-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-slate-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#use-cases"
              className="text-sm text-slate-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Use Cases
            </a>
            <a
              href="#testimonials"
              className="text-sm text-slate-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </a>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col gap-4">
              <a
                href="#about"
                className="text-sm text-slate-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-slate-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#use-cases"
                className="text-sm text-slate-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Use Cases
              </a>
              <a
                href="#testimonials"
                className="text-sm text-slate-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white hover:bg-slate-800 justify-start"
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-white justify-start"
                >
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
