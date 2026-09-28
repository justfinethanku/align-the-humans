import type { Metadata } from 'next'
import { Archivo, Inter, Manrope } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './globals.css'
import '@/components/site/site.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Marketing site face. Variable width axis: expanded for display, normal for body.
const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  axes: ['wdth'],
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'fallback',
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})

const SITE_TITLE = 'Align the Humans | Agree on the partnership before you commit to it'
const SITE_DESCRIPTION =
  'Find out what you and your business partner are actually agreeing to. Each of you answers on your own, you see where your expectations differ, and you build a shared brief to take to your lawyer.'

export const metadata: Metadata = {
  metadataBase: new URL('https://alignthehumans.com'),
  title: {
    default: SITE_TITLE,
    template: '%s | Align the Humans',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'business partnership agreement',
    'business partner expectations',
    'questions to ask a business partner',
    'partnership terms',
    'co-owner agreement preparation',
    'agency partnership',
    'bringing on a business partner',
    'equity split conversation',
    'partner compensation',
    'operating agreement preparation',
  ],
  authors: [{ name: 'Align the Humans' }],
  creator: 'Align the Humans',
  publisher: 'Align the Humans',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Align the Humans',
    title: 'Agree on the partnership before you commit to it',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Align the Humans: agree on the partnership before you commit to it',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agree on the partnership before you commit to it',
    description: SITE_DESCRIPTION,
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
    name: 'Align the Humans',
    url: 'https://alignthehumans.com',
    logo: 'https://alignthehumans.com/icon.svg',
    description:
      'A structured process that helps business partners uncover different expectations about ownership, money, work, decisions, and exits before they commit.',
    foundingDate: '2025',
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${manrope.variable} ${archivo.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c')
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          storageKey="align-the-humans-theme-v2"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
