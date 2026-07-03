/**
 * Login Page
 * Email and password authentication with Supabase
 * Matches design templates for both light and dark modes
 */

'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
      className="h-12 w-full rounded-lg text-base font-semibold"
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
    <div className="w-full rounded-xl bg-card p-6 sm:p-8 shadow-lg">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-foreground tracking-tight text-2xl sm:text-3xl font-bold leading-tight">
          Log In to Your Account
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base font-normal leading-normal pt-2">
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
              className="h-12 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-2">
              <Label
                htmlFor="password"
                className="text-foreground text-sm font-medium leading-normal"
              >
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
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
                className="h-12 w-full rounded-lg border border-input bg-background pr-12 pl-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <SubmitButton />
      </form>

      {/* Sign Up Link */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
