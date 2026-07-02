/**
 * Forgot Password Page
 * Lets a user request a password reset email via Supabase Auth.
 * Matches the visual design of /login and /signup (which live in the
 * app/(auth) route group). This page must live at the literal URL
 * /auth/forgot-password (not /forgot-password) because that's the path
 * already whitelisted in middleware.ts and linked from login/page.tsx, so
 * it lives under app/auth/ (a real path segment) rather than inside the
 * app/(auth) route group, and reuses the same shadcn components + visual
 * chrome as app/(auth)/layout.tsx inline.
 */

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { forgotPasswordAction } from '@/app/(auth)/login/actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await forgotPasswordAction(email);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setSubmitted(true);
    });
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
      {/* Header with Logo */}
      <div className="absolute top-0 left-0 w-full p-6 lg:p-10">
        <header className="flex items-center justify-between gap-4 text-foreground">
          <div className="flex items-center gap-4">
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
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
              Align The Humans
            </h2>
          </div>
          <ThemeToggle />
        </header>
      </div>

      {/* Main Content */}
      <main className="flex w-full max-w-md flex-col items-center justify-center p-4">
        <div className="w-full rounded-xl bg-card p-6 sm:p-8 shadow-lg">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-foreground tracking-tight text-2xl sm:text-3xl font-bold leading-tight">
              Reset Your Password
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base font-normal leading-normal pt-2">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="mt-8">
              <div
                className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20 p-4"
                role="alert"
              >
                <p className="text-sm text-green-800 dark:text-green-200">
                  Check your email. If an account exists for <strong>{email}</strong>, we&apos;ve
                  sent a link to reset your password.
                </p>
              </div>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Back to log in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="flex flex-col">
                  <Label
                    htmlFor="email"
                    className="text-foreground text-sm font-medium leading-normal pb-2"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-12 w-full rounded-lg text-base font-semibold"
                >
                  {isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Remembered your password?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full p-6 text-center">
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <a
            className="hover:underline hover:text-primary"
            href="/terms"
          >
            Terms of Service
          </a>
          <a
            className="hover:underline hover:text-primary"
            href="/privacy"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}