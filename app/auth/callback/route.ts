/**
 * Auth Callback Route Handler
 * Handles email verification callbacks from Supabase Auth
 * Exchanges the auth code for a session and redirects to login page
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/login';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // Handle cookies set in server component
              // This can fail during middleware execution
            }
          },
        },
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to login page with success message
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If there's an error or no code, redirect to login with error
  const errorUrl = new URL('/login', request.url);
  errorUrl.searchParams.set('error', 'verification_failed');
  return NextResponse.redirect(errorUrl);
}
