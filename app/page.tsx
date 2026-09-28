import { Metadata } from 'next'

import { Boundary } from '@/components/homepage/Boundary'
import { FAQ } from '@/components/homepage/FAQ'
import { Hero } from '@/components/homepage/Hero'
import { HiddenDifference } from '@/components/homepage/HiddenDifference'
import { HowItWorks } from '@/components/homepage/HowItWorks'
import { PilotCTA } from '@/components/homepage/PilotCTA'
import { Situations } from '@/components/homepage/Situations'
import { WalkAway } from '@/components/homepage/WalkAway'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { FAQSchema } from '@/components/seo/FAQSchema'
import { HowToSchema } from '@/components/seo/HowToSchema'
import { WebApplicationSchema } from '@/components/seo/WebApplicationSchema'

export const metadata: Metadata = {
  description:
    'For business partners and co-owners: work through ownership, money, roles, decisions, and exits. Answer separately, uncover different expectations, and build a shared brief for your lawyer.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <div className="site">
      <WebApplicationSchema />
      <HowToSchema />
      <FAQSchema />
      <Header />
      <main>
        <Hero />
        <HiddenDifference />
        <Situations />
        <HowItWorks />
        <WalkAway />
        <Boundary />
        <FAQ />
        <PilotCTA />
      </main>
      <Footer />
    </div>
  )
}
