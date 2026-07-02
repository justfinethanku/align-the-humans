import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Privacy Policy — Align the Humans',
  description: 'Privacy policy for Align the Humans, an AI-assisted mutual agreement platform.',
}

function LegalDraftNote() {
  return (
    <p className="text-sm text-muted-foreground border border-border rounded-lg px-4 py-3 bg-muted/30">
      Plain-language draft — final legal review pending.
    </p>
  )
}

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: July 1, 2026
            </p>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-foreground">
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                1. What We Collect
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you use Align the Humans, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Account information</strong> — your email
                  address and name when you sign up
                </li>
                <li>
                  <strong className="text-foreground">Alignment responses</strong> — the answers
                  you submit during alignments, including clarity context and resolution inputs
                </li>
                <li>
                  <strong className="text-foreground">Usage data</strong> — basic logs of how you
                  interact with the service (pages visited, features used, timestamps) to keep
                  the platform running reliably
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                2. How We Use Your Data
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Run alignments and facilitate the agreement process between you and your partner</li>
                <li>Send AI analysis of your responses to identify agreements and conflicts</li>
                <li>Authenticate your account and keep your session secure</li>
                <li>Send transactional emails (invites, notifications) related to your alignments</li>
                <li>Improve and maintain the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                3. Third-Party Services
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We rely on trusted third-party providers to operate the service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Anthropic Claude</strong> (via the Vercel AI
                  Gateway) — processes your alignment responses to generate analysis, suggestions,
                  and agreement documents
                </li>
                <li>
                  <strong className="text-foreground">Resend</strong> — delivers transactional
                  emails such as partner invitations
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong> — hosts the application and
                  handles request routing
                </li>
                <li>
                  <strong className="text-foreground">Supabase</strong> — provides authentication,
                  database storage, and realtime updates for your alignments
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                These providers process data on our behalf under their own privacy policies and
                data processing agreements.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                4. Your Answers Stay Private Until You Both Submit
              </h2>
              <p className="text-muted-foreground leading-relaxed border-l-4 border-primary pl-4">
                Your answers are never shown to your partner until both of you have submitted.
                This is a core design principle of Align the Humans — independent thinking
                requires that neither party can see the other&apos;s responses before completing
                their own.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                5. We Do Not Sell Your Data
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, rent, or trade your personal information to third parties for
                marketing or advertising purposes. Your alignment content is used solely to
                provide the service to you and your partner.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                6. Data Deletion
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You can request deletion of your account and associated data at any time by
                contacting us at{' '}
                <a
                  href="mailto:support@alignthehumans.com"
                  className="text-primary hover:underline"
                >
                  support@alignthehumans.com
                </a>
                . We will process deletion requests within a reasonable timeframe, subject to any
                legal obligations to retain certain records.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                7. Cookies
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies limited to authentication and session management — keeping you
                signed in and securing your account. We do not use tracking cookies for advertising
                or third-party analytics.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                8. Contact
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Questions about this policy? Reach us at{' '}
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