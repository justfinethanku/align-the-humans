import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://humanalignment.app'),
  title: {
    default: 'Human Alignment - Structure for Every Decision That Matters',
    template: '%s | Human Alignment'
  },
  description: 'From household chores to cofounder equity - structured collaboration that turns any decision into clarity. Think independently, align collectively, decide confidently. 87% success rate, 10,000+ decisions aligned.',
  keywords: [
    'alignment',
    'collaborative decision-making',
    'structured thinking',
    'partnership decisions',
    'team alignment',
    'household decisions',
    'cofounder agreement',
    'AI collaboration',
    'independent thinking',
    'collective intelligence',
    'decision infrastructure',
    'proactive alignment'
  ],
  authors: [{ name: 'Human Alignment Team' }],
  creator: 'Human Alignment',
  publisher: 'Human Alignment',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Human Alignment',
    title: 'Human Alignment - Structure for Every Decision That Matters',
    description: 'From household chores to cofounder equity - structured collaboration that turns any decision into clarity. Think independently, align collectively, decide confidently.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Human Alignment - Structure for Every Decision'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Human Alignment - Structure for Every Decision That Matters',
    description: 'From household chores to cofounder equity - structured collaboration that turns any decision into clarity.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: './',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Human Alignment',
    url: 'https://humanalignment.app',
    logo: 'https://humanalignment.app/logo.png',
    description: 'Infrastructure for collaborative decision-making at any scale - from household chores to cofounder equity',
    foundingDate: '2025',
  }

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c')
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
