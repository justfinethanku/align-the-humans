import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Terms of Service — Align the Humans',
  description: 'Terms of service for Align the Humans, an AI-assisted mutual agreement platform.',
}

function LegalDraftNote() {
  return (
    <p className="text-sm text-muted-foreground border border-border rounded-lg px-4 py-3 bg-muted/30">
      Plain-language draft — final legal review pending.
    </p>
  )
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <article className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            ← Back to home
          </Link>

          <LegalDraftNote />

          <header className="mt-8 mb-10">
            <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: July 1, 2026
            </p>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-foreground">
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                1. The Service
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Align the Humans is an AI-assisted platform that helps two people reach mutual
                agreement on important decisions. You and your partner answer questions independently,
                our AI analyzes your responses, surfaces areas of agreement and conflict, and guides
                you toward a shared understanding — culminating in a written agreement you can both
                sign.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                2. Not Legal Advice
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Align the Humans is not a law firm and does not provide legal advice. Agreements
                generated through the platform are aids to mutual understanding between you and your
                partner — they are not substitutes for professional legal counsel. For matters with
                significant legal, financial, or regulatory implications, consult a qualified
                attorney before relying on any output from this service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                3. Your Account
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You are responsible for maintaining the security of your account credentials and
                for all activity that occurs under your account. You agree to provide accurate
                information when creating an account and to keep it up to date.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                You must not share your account with others or use another person&apos;s account
                without permission. Notify us promptly if you suspect unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                4. Acceptable Use
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree to use Align the Humans only for lawful purposes and in good faith. You
                must not:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Submit false, misleading, or harmful content</li>
                <li>Attempt to access other users&apos; data without authorization</li>
                <li>Interfere with or disrupt the service or its infrastructure</li>
                <li>Use the service to harass, threaten, or coerce another person</li>
                <li>Reverse-engineer, scrape, or abuse the platform or its AI features</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                5. AI-Generated Content
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our AI analysis, suggestions, and generated documents are produced by automated
                systems and may be imperfect, incomplete, or contextually inappropriate. You are
                responsible for reviewing all AI-generated content before acting on it or signing
                any agreement. Do not sign a document generated through this platform without
                reading it carefully and confirming it reflects your actual understanding with
                your partner.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                6. Termination
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You may stop using the service at any time. We may suspend or terminate your
                access if you violate these terms or if we discontinue the service. Upon
                termination, your right to use the platform ends, though provisions that by their
                nature should survive (such as liability limitations) will remain in effect.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                7. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by law, Align the Humans and its operators are not
                liable for any indirect, incidental, special, consequential, or punitive damages
                arising from your use of the service — including disputes with your alignment
                partner, reliance on AI-generated content, or outcomes of agreements reached through
                the platform. Our total liability for any claim is limited to the amount you paid
                us in the twelve months preceding the claim, or $100, whichever is greater.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                8. Governing Law
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms are governed by the laws of [Jurisdiction], without regard to conflict
                of law principles. Any disputes will be resolved in the courts of [Jurisdiction].
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                9. Contact
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Questions about these terms? Reach us at{' '}
                <a
                  href="mailto:support@alignthehumans.com"
                  className="text-primary hover:underline"
                >
                  support@alignthehumans.com
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>
    </>
  )
}