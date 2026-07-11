import Link from 'next/link'

const productLinks = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: "Who it's for", href: '/#use-cases' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Start an alignment', href: '/signup' },
]

const legalLinks = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
]

const accountLinks = [
  { label: 'Sign in', href: '/login' },
  { label: 'Create account', href: '/signup' },
]

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="font-display text-lg font-bold text-foreground hover:text-primary transition-colors"
            >
              Align the Humans
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Agree on the hard things — without the fight.
            </p>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
          <FooterColumn title="Account" links={accountLinks} />
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © 2026 Align the Humans. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
