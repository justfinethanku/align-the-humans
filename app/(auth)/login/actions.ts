/**
 * Login Server Actions
 * Handles authentication login with Supabase Auth
 */

'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/app/lib/supabase-server';
import { AuthError, formatErrorMessage, logError } from '@/app/lib/errors';

/**
 * Login form state type
 */
export type LoginState = {
  error?: string;
  success?: boolean;
};

/**
 * Server action to handle user login
 * @param prevState Previous form state
 * @param formData Form data containing email and password
 * @returns LoginState with error or success
 */
export async function loginAction(
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    // Extract form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    // Validate inputs
    if (!email || !password) {
      return {
        error: 'Email and password are required',
        success: false,
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        error: 'Please enter a valid email address',
        success: false,
      };
    }

    // Create Supabase client and attempt login
    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication errors
    if (error) {
      logError(error, { context: 'login', email });

      // Return user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return {
          error: 'Invalid email or password. Please try again.',
          success: false,
        };
      }

      if (error.message.includes('Email not confirmed')) {
        return {
          error: 'Please verify your email address before logging in.',
          success: false,
        };
      }

      return {
        error: formatErrorMessage(error),
        success: false,
      };
    }

    // Check if user was returned
    if (!data.user || !data.session) {
      throw new AuthError('Login failed - no user data returned', 500);
    }

    // Success - redirect to original destination or dashboard
    // Note: redirect() throws, so this won't return
    const destination = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard';
    redirect(destination);
  } catch (error) {
    // Catch redirect throws and rethrow
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    // Log unexpected errors
    logError(error, { context: 'login' });

    return {
      error: 'An unexpected error occurred. Please try again.',
      success: false,
    };
  }
}

/**
 * Server action to handle "Forgot Password" flow
 * @param email Email address to send reset link to
 * @returns Success or error message
 */
export async function forgotPasswordAction(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    // Validate email
    if (!email) {
      return { error: 'Email is required', success: false };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: 'Please enter a valid email address', success: false };
    }

    // Create Supabase client and send reset email
    const supabase = createServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) {
      logError(error, { context: 'forgotPassword', email });
      return {
        error: 'Failed to send password reset email. Please try again.',
        success: false,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    logError(error, { context: 'forgotPassword' });
    return {
      error: 'An unexpected error occurred. Please try again.',
      success: false,
    };
  }
}
