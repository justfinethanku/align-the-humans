/**
 * Login Page
 * Email and password authentication with Supabase
 * Matches design templates for both light and dark modes
 */

'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loginAction } from './actions';

/**
 * Submit button with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-[#1A1A1A]"
    >
      {pending ? 'Logging in...' : 'Log In'}
    </Button>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const verified = searchParams.get('verified');
  const verificationError = searchParams.get('error');
  const [state, formAction] = useFormState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(verified === 'true');
  const [showVerificationError, setShowVerificationError] = useState(!!verificationError);

  // Clear error after 5 seconds
  useEffect(() => {
    if (state?.error) {
      const timer = setTimeout(() => {
        // Error will clear on next form submission
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state?.error]);

  // Clear verification success message after 10 seconds
  useEffect(() => {
    if (showVerificationSuccess) {
      const timer = setTimeout(() => {
        setShowVerificationSuccess(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showVerificationSuccess]);

  // Clear verification error message after 10 seconds
  useEffect(() => {
    if (showVerificationError) {
      const timer = setTimeout(() => {
        setShowVerificationError(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showVerificationError]);

  return (
    <div className="w-full rounded-xl bg-white dark:bg-[#252525] p-6 sm:p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-[#111418] dark:text-white tracking-tight text-2xl sm:text-3xl font-bold leading-tight">
          Log In to Your Account
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal leading-normal pt-2">
          Welcome back! Please enter your details.
        </p>
      </div>

      {/* Email Verification Success Message */}
      {showVerificationSuccess && (
        <div
          className="mt-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20 p-4"
          role="alert"
        >
          <p className="text-sm text-green-800 dark:text-green-200">
            Email verified successfully! You can now log in to your account.
          </p>
        </div>
      )}

      {/* Email Verification Error Message */}
      {showVerificationError && (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-200">
            Email verification failed. Please try again or contact support.
          </p>
        </div>
      )}

      {/* Error Message */}
      {state?.error && (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{state.error}</p>
        </div>
      )}

      {/* Login Form */}
      <form action={formAction} className="mt-8 space-y-6">
        {/* Hidden field for redirect destination */}
        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}
        <div className="space-y-4">
          {/* Email Input */}
          <div className="flex flex-col">
            <Label
              htmlFor="email"
              className="text-[#111418] dark:text-slate-200 text-sm font-medium leading-normal pb-2"
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
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-[#111418] placeholder:text-slate-400 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-[#2a2a2a] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-2">
              <Label
                htmlFor="password"
                className="text-[#111418] dark:text-slate-200 text-sm font-medium leading-normal"
              >
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex w-full items-stretch">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="h-12 w-full rounded-lg border border-slate-300 bg-white pr-12 pl-3.5 py-2.5 text-base text-[#111418] placeholder:text-slate-400 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-[#2a2a2a] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <SubmitButton />

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative bg-white dark:bg-[#252525] px-2 text-sm text-slate-400 dark:text-slate-500">
            OR
          </div>
        </div>

        {/* Google Sign In (Placeholder) */}
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-12 w-full rounded-lg border border-slate-300 bg-white px-6 text-base font-medium text-[#111418] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:bg-[#2a2a2a] dark:text-white dark:hover:bg-slate-700/50 dark:focus:ring-offset-[#1A1A1A] dark:focus:ring-slate-500"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.578 12.28c0-.84-.07-1.65-.21-2.44H12v4.6h5.92c-.26 1.48-1.06 2.75-2.24 3.63v3h3.85c2.25-2.08 3.54-5.12 3.54-8.79z"
              fill="#4285F4"
            />
            <path
              d="M12 23c3.27 0 6.02-1.08 8.02-2.92l-3.85-3c-1.08.73-2.45 1.16-4.17 1.16-3.2 0-5.9-2.15-6.87-5.03H1.2v3.1C3.12 20.43 7.24 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.13 14.01c-.2-.6-.31-1.25-.31-1.91s.11-1.31.31-1.91V7.1H1.2C.43 8.63 0 10.25 0 12s.43 3.37 1.2 4.9l3.93-3.89z"
              fill="#FBBC05"
            />
            <path
              d="M12 4.84c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.02 1.18 15.27 0 12 0 7.24 0 3.12 2.57 1.2 6.1l3.93 3.01c.97-2.88 3.67-5.03 6.87-5.03z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google (Coming Soon)
        </Button>
      </form>

      {/* Sign Up Link */}
      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
