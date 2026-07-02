/**
 * Auth Callback Route Handler
 * Handles email verification callbacks from Supabase Auth
 * Exchanges the auth code for a session and redirects to login page
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Validates that a redirect destination is a same-site relative path.
 * Rejects protocol-relative ("//evil.com") and backslash-prefixed
 * ("/\evil.com") values, both of which some browsers/routers will treat
 * as absolute/external even though they start with a single "/".
 */
function isSafeRedirectPath(dest: string | null | undefined): dest is string {
  return (
    !!dest &&
    dest.startsWith('/') &&
    !dest.startsWith('//') &&
    !dest.startsWith('/\\')
  );
}

/**
 * Resolves a same-site redirect destination from a raw string that may be
 * either a relative path (validated via isSafeRedirectPath) or an absolute
 * URL (validated by same-origin check against the current request). Our
 * custom Supabase Auth Hook (app/api/auth/email/route.ts) embeds an
 * absolute `redirect_to` URL in token_hash-flow email links, so this route
 * must accept that shape too, not just a bare relative `next` path.
 * Returns null if nothing safe could be resolved.
 */
function resolveSafeDestination(
  raw: string | null,
  requestUrl: URL
): string | null {
  if (!raw) return null;

  if (isSafeRedirectPath(raw)) {
    return raw;
  }

  try {
    const target = new URL(raw);
    if (target.origin === requestUrl.origin) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    // Not a parseable absolute URL — ignore.
  }

  return null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = requestUrl.searchParams.get('next');
  // Our custom Auth Hook (app/api/auth/email/route.ts) names this param
  // `redirect_to`, not `next`, and its value is an absolute URL.
  const redirectToParam = requestUrl.searchParams.get('redirect_to');

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

  // PKCE code-exchange flow. @supabase/ssr defaults to flowType: 'pkce', so
  // this is what Supabase's default hosted email templates produce when the
  // redirect target (e.g. our own /auth/callback?next=/auth/reset-password
  // built by forgotPasswordAction) has a `?code=` param appended to it.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Honor a same-site `next` param (e.g. recovery flow -> reset-password
      // page) if present; otherwise fall back to the original behavior of
      // sending the user to login with a verified banner.
      if (isSafeRedirectPath(next)) {
        return NextResponse.redirect(new URL(next, request.url));
      }
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  } else if (tokenHash && type) {
    // token_hash + type flow — this is what our custom Supabase Auth Hook
    // (app/api/auth/email/route.ts) builds for signup/recovery/magiclink/
    // email_change confirmation links.
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const destination =
        resolveSafeDestination(next, requestUrl) ??
        resolveSafeDestination(redirectToParam, requestUrl) ??
        (type === 'recovery' ? '/auth/reset-password' : '/dashboard');
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  // If there's an error or neither flow's params were present, redirect to
  // login with an error.
  const errorUrl = new URL('/login', request.url);
  errorUrl.searchParams.set('error', 'verification_failed');
  return NextResponse.redirect(errorUrl);
}
