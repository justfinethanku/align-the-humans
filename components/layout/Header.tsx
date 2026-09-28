'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { RegistrationMark } from '@/components/site/RegistrationMark'

const navLinks = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Example', href: '/example' },
  { label: 'Pricing', href: '/pricing' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const close = () => setMobileMenuOpen(false)

  return (
    <header className="site fixed inset-x-0 top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-md">
      <nav className="mx-auto max-w-6xl px-5 sm:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[1.05rem] font-bold text-ink"
            aria-label="Align the Humans home"
            onClick={close}
          >
            <RegistrationMark size={24} animate />
            <span className="type-heading">Align the Humans</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.95rem] text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <Link href="/login" className="text-[0.95rem] text-ink-soft transition-colors hover:text-ink">
              Sign in
            </Link>
            <Link href="/signup" className="btn-ink btn-sm">
              Start an alignment
            </Link>
          </div>

          <button
            type="button"
            className="-mr-2 p-2 text-ink md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-rule py-4 md:hidden">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={close} className="py-3 text-base text-ink">
                  {link.label}
                </Link>
              ))}
              <Link href="/login" onClick={close} className="py-3 text-base text-ink">
                Sign in
              </Link>
              <Link href="/signup" onClick={close} className="btn-ink mt-3">
                Start an alignment
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
