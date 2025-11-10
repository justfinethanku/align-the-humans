/**
 * Next.js Middleware for Authentication and Session Management
 *
 * This middleware handles:
 * - Session validation and refresh on every request
 * - Cookie-based session persistence
 * - Route protection (requires auth for protected routes)
 * - Redirects unauthenticated users to /login
 * - Allows public routes without authentication
 *
 * Uses @supabase/ssr for proper SSR cookie handling
 *
 * References:
 * - https://supabase.com/docs/guides/auth/server-side/nextjs
 * - https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication
 * These routes are accessible to all users
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/join', // Public join pages via invite token
];

/**
 * Routes that should be accessible only to unauthenticated users
 * If user is logged in, redirect to dashboard
 */
const AUTH_ROUTES = ['/login', '/signup'];

/**
 * Check if a path matches a public route
 * @param path Request pathname
 * @returns true if path is public, false otherwise
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === path) return true;
    // Allow /auth/* routes
    if (path.startsWith('/auth/')) return true;
    // Allow /join/* routes (invite links)
    if (path.startsWith('/join/')) return true;
    return false;
  });
}

/**
 * Check if a path is an auth route (login, signup)
 * @param path Request pathname
 * @returns true if path is auth route, false otherwise
 */
function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.includes(path);
}

/**
 * Middleware function
 * Runs on every request to validate session and manage authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes (except auth), and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') && !pathname.includes('/auth/')
  ) {
    return NextResponse.next();
  }

  // Create response object that we can mutate
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase server client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on both request and response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get user session (this also refreshes the session if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Handle authentication routing logic

  // If user is authenticated and trying to access auth routes (login/signup)
  // Redirect to dashboard
  if (user && isAuthRoute(pathname)) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is NOT authenticated and trying to access protected route
  // Redirect to login
  if (!user && !isPublicRoute(pathname)) {
    const redirectUrl = new URL('/login', request.url);
    // Preserve the original destination for after login
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Allow request to proceed with updated cookies
  return response;
}

/**
 * Middleware configuration
 * Define which routes the middleware should run on
 *
 * Note: We match all routes except static files and API routes
 * This ensures session is validated on every page load
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
