/**
 * Auth Layout Component
 * Provides centered layout for authentication pages (login/signup)
 * Matches design templates with app branding and footer links
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Align The Humans',
  description: 'Log in or create an account to start aligning',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A]">
      {/* Header with Logo */}
      <div className="absolute top-0 left-0 w-full p-6 lg:p-10">
        <header className="flex items-center gap-4 text-[#111418] dark:text-white">
          <div className="h-6 w-6">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_6_319)">
                <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" />
              </g>
              <defs>
                <clipPath id="clip0_6_319">
                  <rect fill="white" height="48" width="48" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            Align The Humans
          </h2>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex w-full max-w-md flex-col items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full p-6 text-center">
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <a
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
            href="/terms"
          >
            Terms of Service
          </a>
          <a
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
            href="/privacy"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
