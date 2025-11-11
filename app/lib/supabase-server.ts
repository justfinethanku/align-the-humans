/**
 * Supabase client for server-side usage
 * Uses cookies for session management in Next.js App Router
 *
 * Usage in Server Components:
 * ```tsx
 * import { createServerClient } from '@/app/lib/supabase-server';
 * import { cookies } from 'next/headers';
 *
 * export default async function MyPage() {
 *   const supabase = createServerClient();
 *   const { data } = await supabase.from('profiles').select('*');
 *   // Use data...
 * }
 * ```
 *
 * Usage in Route Handlers:
 * ```tsx
 * import { createServerClient } from '@/app/lib/supabase-server';
 * import { cookies } from 'next/headers';
 *
 * export async function GET(request: Request) {
 *   const supabase = createServerClient();
 *   // Use supabase client...
 * }
 * ```
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';
import { AuthError } from './errors';

/**
 * Creates a Supabase client for server-side usage
 * This client is suitable for:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 * - Middleware
 *
 * Automatically manages session via cookies
 *
 * @returns Supabase server client with TypeScript types
 */
export function createServerClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    );
  }

  const cookieStore = cookies();

  // Create server client with cookie handling
  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client with service role key for admin operations
 * ⚠️ DANGER: This client bypasses Row-Level Security (RLS)
 *
 * Only use for:
 * - Server-side admin operations
 * - Background jobs
 * - Operations that require elevated privileges
 *
 * Never expose service role key to client!
 *
 * @returns Supabase admin client with full privileges
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    );
  }

  const cookieStore = cookies();

  // Create admin client with service role key
  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore cookie setting errors in Server Components
          }
        },
      },
    }
  );
}

/**
 * Type-safe shorthand for the server client
 */
export type SupabaseServerClient = ReturnType<typeof createServerClient>;

/**
 * Type-safe shorthand for the admin client
 */
export type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

/**
 * Gets the current authenticated user from server-side context
 * @param supabase Supabase client instance
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Gets the current session from server-side context
 * @param supabase Supabase client instance
 * @returns Session object or null if not authenticated
 */
export async function getCurrentSession(supabase: SupabaseServerClient) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

/**
 * Requires authentication - throws error if user not authenticated
 * Use in Server Components or Route Handlers where auth is mandatory
 *
 * @param supabase Supabase client instance
 * @returns Authenticated user object
 * @throws AuthError if user is not authenticated
 */
export async function requireAuth(supabase: SupabaseServerClient) {
  const user = await getCurrentUser(supabase);

  if (!user) {
    throw new AuthError('Authentication required', 401);
  }

  return user;
}
