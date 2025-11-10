/**
 * Supabase client for browser/client components
 * Uses environment variables for configuration
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client';
 *
 * import { createClient } from '@/app/lib/supabase-browser';
 *
 * export function MyComponent() {
 *   const supabase = createClient();
 *   // Use supabase client...
 * }
 * ```
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Creates a Supabase client for browser usage
 * This client is suitable for:
 * - Client Components (with 'use client' directive)
 * - Browser-side data fetching
 * - Realtime subscriptions
 * - Auth state management in client
 *
 * @returns Supabase browser client with TypeScript types
 */
export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    );
  }

  // Create browser client with TypeScript generics
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}

/**
 * Type-safe shorthand for the browser client
 */
export type SupabaseBrowserClient = ReturnType<typeof createClient>;
