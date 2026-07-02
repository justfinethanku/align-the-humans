/**
 * Signup Page
 * User registration with email, password, and username
 * Creates Supabase Auth account and profile entry
 * Matches design templates for both light and dark modes
 */

'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { signupAction } from './actions';

/**
 * Submit button with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-lg text-base font-bold"
    >
      {pending ? 'Creating Account...' : 'Sign Up'}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (state?.error || state?.success) {
      const timer = setTimeout(() => {
        // Will clear on next form submission
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state?.error, state?.success]);

  return (
    <div className="w-full rounded-xl bg-card p-6 sm:p-8 shadow-lg">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-[-0.033em] text-foreground">
          Create Your Account
        </h1>
        <p className="text-base font-normal leading-normal text-muted-foreground pt-2">
          Start aligning on decisions that matter - from household logistics to business strategy.
        </p>
      </div>

      {/* Success Message */}
      {state?.success && (
        <div
          className="mt-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20 p-4"
          role="alert"
        >
          <p className="text-sm text-green-800 dark:text-green-200">
            {state.error || 'Account created successfully! Redirecting to dashboard...'}
          </p>
        </div>
      )}

      {/* General Error Message */}
      {state?.error && !state?.success && (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{state.error}</p>
        </div>
      )}

      {/* Signup Form */}
      <form action={formAction} className="mt-8 space-y-6">
        <div className="space-y-4">
          {/* Username Input */}
          <div>
            <Label htmlFor="username" className="sr-only">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="Username"
              aria-invalid={!!state?.fieldErrors?.username}
              aria-describedby={state?.fieldErrors?.username ? 'username-error' : undefined}
              className="h-14 w-full rounded-lg border border-input bg-background p-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
            />
            {state?.fieldErrors?.username && (
              <p id="username-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {state.fieldErrors.username}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <Label htmlFor="email-address" className="sr-only">
              Email address
            </Label>
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              aria-invalid={!!state?.fieldErrors?.email}
              aria-describedby={state?.fieldErrors?.email ? 'email-error' : undefined}
              className="h-14 w-full rounded-lg border border-input bg-background p-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
            />
            {state?.fieldErrors?.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <Label htmlFor="password" className="sr-only">
              Password
            </Label>
            <div className="relative flex w-full items-stretch">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Password"
                aria-invalid={!!state?.fieldErrors?.password}
                aria-describedby={state?.fieldErrors?.password ? 'password-error' : undefined}
                className="h-14 w-full rounded-lg border border-input bg-background pr-12 pl-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {state?.fieldErrors?.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <Label htmlFor="confirm-password" className="sr-only">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm Password"
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
              aria-describedby={
                state?.fieldErrors?.confirmPassword ? 'confirm-password-error' : undefined
              }
              className="h-14 w-full rounded-lg border border-input bg-background p-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
            />
            {state?.fieldErrors?.confirmPassword && (
              <p id="confirm-password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {state.fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Terms of Service Checkbox */}
        <div className="flex items-center">
          <input
            id="terms-of-service"
            name="terms-of-service"
            type="checkbox"
            required
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
          />
          <Label
            htmlFor="terms-of-service"
            className="ml-2 block text-sm text-muted-foreground"
          >
            I agree to the{' '}
            <Link
              href="/terms"
              className="font-medium text-primary hover:text-primary/80"
            >
              Terms of Service
            </Link>
          </Label>
        </div>

        {/* Submit Button */}
        <SubmitButton />
      </form>

      {/* Login Link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
