import Link from 'next/link'

import { RegistrationMark } from '@/components/site/RegistrationMark'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'See an example', href: '/example' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Start an alignment', href: '/signup' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/signup' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="site w-full border-t border-rule bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-ink">
              <RegistrationMark size={22} />
              <span className="type-heading">Align the Humans</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              Get clear with your business partner before money, ownership, and expectations make it
              painful. We&apos;re not a law firm, and nothing here is legal advice.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-ink">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-soft transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-14 border-t border-rule pt-8 text-sm text-ink-soft">
          © {new Date().getFullYear()} Align the Humans
        </p>
      </div>
    </footer>
  )
}
