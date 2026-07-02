/**
 * Reset Password Page
 * Runs after a user clicks a recovery link, which establishes a temporary
 * session via /auth/callback. Lets them set a new password.
 *
 * Must live at the literal URL /auth/reset-password (not /reset-password)
 * because that's the path already whitelisted in middleware.ts and built
 * into the recovery email links (app/api/auth/email/route.ts), so it lives
 * under app/auth/ (a real path segment) rather than inside the
 * app/(auth) route group, and reuses the same shadcn components + visual
 * chrome as app/(auth)/layout.tsx inline.
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { createClient } from '@/app/lib/supabase-browser';

/**
 * Same password rule used at signup (app/(auth)/signup/actions.ts):
 * at least 8 characters, containing lowercase, uppercase, and a number.
 */
function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain uppercase, lowercase, and a number';
  }
  return null;
}

type SessionState = 'checking' | 'active' | 'missing';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>(
    {}
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSessionState(data.session ? 'active' : 'missing');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSessionState('active');
      } else if (event === 'SIGNED_OUT') {
        setSessionState('missing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const passwordError = validatePassword(password);
    const confirmError =
      !confirmPassword
        ? 'Please confirm your password'
        : password !== confirmPassword
          ? 'Passwords do not match'
          : undefined;

    if (passwordError || confirmError) {
      setFieldErrors({
        password: passwordError ?? undefined,
        confirmPassword: confirmError,
      });
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message || 'Failed to update password. Please try again.');
        return;
      }

      toast.success('Password updated successfully.');
      router.push('/dashboard');
      router.refresh();
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
              Align the Humans
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
              Set a New Password
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base font-normal leading-normal pt-2">
              Choose a new password for your account.
            </p>
          </div>

          {sessionState === 'checking' && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Verifying your reset link...
            </div>
          )}

          {sessionState === 'missing' && (
            <div className="mt-8">
              <div
                className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4"
                role="alert"
              >
                <p className="text-sm text-red-800 dark:text-red-200">
                  This password reset link has expired or is invalid. Please request a new one.
                </p>
              </div>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link
                  href="/auth/forgot-password"
                  className="font-semibold text-primary hover:underline"
                >
                  Request a new reset link
                </Link>
              </p>
            </div>
          )}

          {sessionState === 'active' && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                {/* New Password Input */}
                <div className="flex flex-col">
                  <Label
                    htmlFor="password"
                    className="text-foreground text-sm font-medium leading-normal pb-2"
                  >
                    New Password
                  </Label>
                  <div className="relative flex w-full items-stretch">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                      className="h-12 w-full rounded-lg border border-input bg-background pr-12 pl-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
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
                  {fieldErrors.password && (
                    <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="flex flex-col">
                  <Label
                    htmlFor="confirm-password"
                    className="text-foreground text-sm font-medium leading-normal pb-2"
                  >
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={!!fieldErrors.confirmPassword}
                    aria-describedby={
                      fieldErrors.confirmPassword ? 'confirm-password-error' : undefined
                    }
                    className="h-12 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-0 focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
                  />
                  {fieldErrors.confirmPassword && (
                    <p
                      id="confirm-password-error"
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="h-12 w-full rounded-lg text-base font-semibold"
              >
                {isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
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