/**
 * Partner Search API Route
 *
 * GET /api/partners/search?q={query}
 *
 * Searches for users by display name or email to add as alignment partners.
 * Returns matching profiles from the database.
 *
 * Implementation notes:
 * - profiles RLS is own-row only (see supabase/migrations/*_init_human_alignment.sql
 *   and 20260701120000_fix_alignments_participant_rls.sql, which only adds
 *   admin-read, not cross-user read), so a caller can never see another
 *   user's profile row through the RLS-bound client. Both the display-name
 *   and email lookups below therefore run through createAdminClient()
 *   (service role, server-only, bypasses RLS).
 * - Email is not stored on public.profiles, only on auth.users, which is not
 *   directly queryable via PostgREST. Supabase's auth admin API
 *   (supabase.auth.admin.listUsers) has no server-side email filter in the
 *   installed SDK version, so we page through users and filter in memory.
 *   Fine for this app's current small user base; if the user count grows
 *   significantly, prefer denormalizing a searchable email column onto
 *   profiles (kept in sync via a trigger) instead of scanning auth.users.
 * - The response NEVER includes email or any other auth.users field for
 *   anyone but the requester's own results are excluded entirely (self is
 *   never returned) -- only { id, display_name } is exposed, to avoid
 *   leaking other users' PII to arbitrary authenticated callers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient, requireAuth } from '@/app/lib/supabase-server';
import { createErrorResponse } from '@/app/lib/errors';

interface SearchResult {
  id: string;
  display_name: string | null;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

// Upper bound on how many auth users we page through when matching by email.
// The installed supabase-js admin API has no server-side email filter, so we
// have to list-and-filter in memory; this caps the cost of that scan.
const EMAIL_SEARCH_USER_SCAN_LIMIT = 1000;

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth check goes through the RLS-bound client (reads the session cookie).
  const supabase = createServerClient();

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);

    // 2. Get search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_QUERY',
            message: 'Search query must be at least 2 characters',
          },
        },
        { status: 400 }
      );
    }

    const searchTerm = query.trim().toLowerCase();

    // All data access below uses the admin client (service role) because
    // profiles RLS is own-row only -- the RLS-bound client would only ever
    // be able to see the caller's own profile.
    const admin = createAdminClient();

    // 3. Search profiles by display name
    const { data: nameMatches, error: nameError } = await admin
      .from('profiles')
      .select('id, display_name')
      .neq('id', user.id) // Exclude current user
      .ilike('display_name', `%${searchTerm}%`)
      .limit(10);

    if (nameError) {
      console.error('Profile display-name search error:', nameError);
      throw new Error('Failed to search profiles');
    }

    // 4. Search by email via the Supabase Auth admin API. There is no
    // server-side email filter available, so page through users (capped)
    // and filter in memory.
    const emailMatchedUserIds = new Set<string>();
    let page = 1;
    const perPage = 200;

    while (emailMatchedUserIds.size < 10 && (page - 1) * perPage < EMAIL_SEARCH_USER_SCAN_LIMIT) {
      const { data: userPage, error: listUsersError } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listUsersError) {
        console.error('Auth admin listUsers error:', listUsersError);
        break; // Non-fatal -- fall back to display-name-only results
      }

      const users = userPage?.users ?? [];
      for (const authUser of users) {
        if (
          authUser.id !== user.id &&
          typeof authUser.email === 'string' &&
          authUser.email.toLowerCase().includes(searchTerm)
        ) {
          emailMatchedUserIds.add(authUser.id);
        }
      }

      if (users.length < perPage) break; // No more pages
      page += 1;
    }

    // 5. Resolve display names for the email-matched users (never expose
    // their email addresses in the response).
    let emailMatches: SearchResult[] = [];
    if (emailMatchedUserIds.size > 0) {
      const { data: emailProfiles, error: emailProfilesError } = await admin
        .from('profiles')
        .select('id, display_name')
        .in('id', Array.from(emailMatchedUserIds));

      if (emailProfilesError) {
        console.error('Profile lookup for email matches error:', emailProfilesError);
      } else {
        emailMatches = (emailProfiles || []).map((profile) => ({
          id: profile.id,
          display_name: profile.display_name,
        }));
      }
    }

    // 6. Merge display-name and email matches, de-duplicating by id.
    const resultsById = new Map<string, SearchResult>();
    for (const profile of nameMatches || []) {
      resultsById.set(profile.id, { id: profile.id, display_name: profile.display_name });
    }
    for (const profile of emailMatches) {
      resultsById.set(profile.id, profile);
    }

    const results = Array.from(resultsById.values()).slice(0, 10);

    // 7. Return results
    const response: SearchResponse = {
      results,
      query: query.trim(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Partner search error:', error);
    return createErrorResponse(error) as any;
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
