/**
 * Partner Search API Route
 *
 * GET /api/partners/search?q={query}
 *
 * Answers only an exact, case-insensitive email address. A fragment such as
 * "jo@" and any display-name query return no one. There is no name scan.
 *
 * The auth admin API in the installed supabase-js has no exact-email filter,
 * so an exact address still pages `listUsers` (capped) and compares in memory.
 * Profile rows are read with the session client, under RLS, so a hit is
 * returned only when the caller can already see that profile (someone they
 * share an alignment with, or a platform admin). This route does not widen
 * that visibility. The response is `{ id, display_name }` and never includes
 * an email. The caller is never returned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient, requireAuth, type SupabaseAdminClient } from '@/app/lib/supabase-server';
import { createErrorResponse, RateLimitError } from '@/app/lib/errors';
import { checkRateLimit, rateLimitKeyForUser } from '@/app/lib/rate-limit';
import {
  PARTNER_SEARCH_RATE_LIMIT,
  findExactEmailUserId,
  normalizeExactEmail,
} from '@/app/lib/partner-search';

interface SearchResult {
  id: string;
  display_name: string | null;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

// Upper bound on how many auth users we page through for one exact email.
// listUsers has no server-side email filter in the installed SDK.
const EMAIL_SEARCH_USER_SCAN_LIMIT = 1000;
const EMAIL_SEARCH_PAGE_SIZE = 200;

async function findUserIdByExactEmail(
  admin: SupabaseAdminClient,
  normalizedEmail: string,
  excludeUserId: string
): Promise<string | null> {
  let page = 1;

  while ((page - 1) * EMAIL_SEARCH_PAGE_SIZE < EMAIL_SEARCH_USER_SCAN_LIMIT) {
    const { data: userPage, error: listUsersError } = await admin.auth.admin.listUsers({
      page,
      perPage: EMAIL_SEARCH_PAGE_SIZE,
    });

    if (listUsersError) {
      console.error('Auth admin listUsers error:', listUsersError);
      return null;
    }

    const users = userPage?.users ?? [];
    const match = findExactEmailUserId(users, normalizedEmail, excludeUserId);
    if (match) return match;
    if (users.length < EMAIL_SEARCH_PAGE_SIZE) return null;
    page += 1;
  }

  return null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();

  try {
    const user = await requireAuth(supabase);

    const query = request.nextUrl.searchParams.get('q') ?? '';
    const normalizedEmail = normalizeExactEmail(query);
    const empty: SearchResponse = { results: [], query: query.trim() };

    // Fragments and names match nobody and do not touch auth.users.
    // Only an exact address consumes the rate limit and runs the lookup.
    if (!normalizedEmail) {
      return NextResponse.json(empty, {
        status: 200,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    const rateLimitResult = await checkRateLimit(
      rateLimitKeyForUser(user.id, 'partners.search'),
      PARTNER_SEARCH_RATE_LIMIT
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError('Too many partner searches. Please try again shortly.', {
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    const admin = createAdminClient();
    const matchedUserId = await findUserIdByExactEmail(admin, normalizedEmail, user.id);

    let results: SearchResult[] = [];
    if (matchedUserId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', matchedUserId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile lookup for email match error:', profileError);
      } else if (profile) {
        results = [{ id: profile.id, display_name: profile.display_name }];
      }
    }

    const response: SearchResponse = {
      results,
      query: query.trim(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Partner search error:', error);
    const response = createErrorResponse(error);
    if (error instanceof RateLimitError && typeof error.details?.retryAfter === 'number') {
      response.headers.set('Retry-After', String(error.details.retryAfter));
    }
    return response as NextResponse;
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
