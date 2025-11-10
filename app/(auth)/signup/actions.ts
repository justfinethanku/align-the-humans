/**
 * Signup Server Actions
 * Handles user registration with Supabase Auth and profile creation
 */

'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/app/lib/supabase-server';
import { upsertProfile } from '@/app/lib/db-helpers';
import { AuthError, ValidationError, formatErrorMessage, logError } from '@/app/lib/errors';

/**
 * Signup form state type
 */
export type SignupState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
};

/**
 * Validates signup form data
 */
function validateSignupData(formData: FormData): {
  isValid: boolean;
  errors: SignupState['fieldErrors'];
  data?: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
} {
  const username = (formData.get('username') as string || '').trim();
  const email = (formData.get('email') as string || '').trim();
  const password = formData.get('password') as string || '';
  const confirmPassword = formData.get('confirm-password') as string || '';

  const errors: SignupState['fieldErrors'] = {};

  // Username validation
  if (!username) {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (username.length > 30) {
    errors.username = 'Username must be less than 30 characters';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
  }

  // Email validation
  if (!email) {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  // Password validation
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.password = 'Password must contain uppercase, lowercase, and a number';
  }

  // Confirm password validation
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid ? { username, email, password, confirmPassword } : undefined,
  };
}

/**
 * Server action to handle user signup
 * @param prevState Previous form state
 * @param formData Form data containing username, email, password, confirm password
 * @returns SignupState with error or success
 */
export async function signupAction(
  prevState: SignupState | null,
  formData: FormData
): Promise<SignupState> {
  try {
    // Validate form data
    const validation = validateSignupData(formData);

    if (!validation.isValid) {
      return {
        fieldErrors: validation.errors,
        success: false,
      };
    }

    const { username, email, password } = validation.data!;

    // Create Supabase client
    const supabase = createServerClient();

    // Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    // Handle authentication errors
    if (authError) {
      logError(authError, { context: 'signup', email, username });

      // Return user-friendly error messages
      if (authError.message.includes('already registered')) {
        return {
          error: 'An account with this email already exists. Please log in instead.',
          fieldErrors: {
            email: 'Email already registered',
          },
          success: false,
        };
      }

      if (authError.message.includes('invalid email')) {
        return {
          error: 'Invalid email address',
          fieldErrors: {
            email: 'Invalid email format',
          },
          success: false,
        };
      }

      return {
        error: formatErrorMessage(authError),
        success: false,
      };
    }

    // Check if user was created
    if (!authData.user) {
      throw new AuthError('Signup failed - no user data returned', 500);
    }

    // Create profile in database
    const { error: profileError } = await upsertProfile(
      supabase,
      authData.user.id,
      username
    );

    if (profileError) {
      logError(profileError, {
        context: 'signup-profile-creation',
        userId: authData.user.id,
        username,
      });

      // Profile creation failed, but user account was created
      // This is a partial success - user can still log in
      // We'll log the error but continue
      console.error('Profile creation failed:', profileError);
    }

    // Check if email confirmation is required
    if (authData.session) {
      // User is already logged in (email confirmation disabled)
      redirect('/dashboard');
    } else {
      // Email confirmation required
      return {
        success: true,
        error: 'Account created! Please check your email to verify your account before logging in.',
      };
    }
  } catch (error) {
    // Catch redirect throws and rethrow
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    // Log unexpected errors
    logError(error, { context: 'signup' });

    return {
      error: 'An unexpected error occurred during signup. Please try again.',
      success: false,
    };
  }
}
