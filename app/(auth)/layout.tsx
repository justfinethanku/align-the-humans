/**
 * Auth Layout Component
 * Centered layout for login/signup on the marketing site's paper theme,
 * so the first screen after "Start your partnership alignment" matches the site.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { RegistrationMark } from '@/components/site/RegistrationMark';

export const metadata: Metadata = {
  title: 'Sign in or create an account',
  description: 'Sign in or create an account to start your partnership alignment.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site relative flex min-h-screen w-full flex-col items-center justify-center">
      <div className="absolute left-0 top-0 w-full p-6 lg:p-10">
        <header className="flex items-center justify-between gap-4 text-ink">
          <Link href="/" className="flex items-center gap-2.5 font-bold" aria-label="Align the Humans home">
            <RegistrationMark size={24} />
            <span className="type-heading text-lg">Align the Humans</span>
          </Link>
        </header>
      </div>

      <main className="flex w-full max-w-md flex-col items-center justify-center p-4 pb-20 pt-24">
        {children}
      </main>

      <footer className="absolute bottom-0 w-full p-6 text-center">
        <div className="flex items-center justify-center gap-6 text-sm text-ink-soft">
          <Link className="hover:text-ink hover:underline" href="/terms">
            Terms of Service
          </Link>
          <Link className="hover:text-ink hover:underline" href="/privacy">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
