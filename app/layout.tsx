import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-inter',
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://alignthehumans.com'),
  title: {
    default: 'Align the Humans - Agree on the Hard Things, Without the Fight',
    template: '%s | Align the Humans'
  },
  description: 'Agree on the hard things - without the fight. From cofounder equity to household decisions: answer independently, let AI find where you already agree, and resolve only the conflicts that actually matter.',
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
        url: '/og-image.jpg',
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
    images: ['/og-image.jpg'],
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
    url: 'https://alignthehumans.com',
    logo: 'https://alignthehumans.com/logo.png',
    description: 'Infrastructure for collaborative decision-making at any scale - from household chores to cofounder equity',
    foundingDate: '2025',
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c')
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
