/**
 * Partner Search API Route
 *
 * GET /api/partners/search?q={query}
 *
 * Searches for users by display name or email to add as alignment partners.
 * Returns matching profiles from the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { createErrorResponse } from '@/app/lib/errors';

interface SearchResult {
  id: string;
  display_name: string | null;
  email?: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // 3. Search profiles by display name
    // Note: We use ilike for case-insensitive pattern matching
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .neq('id', user.id) // Exclude current user
      .ilike('display_name', `%${searchTerm}%`)
      .limit(10);

    if (profileError) {
      console.error('Profile search error:', profileError);
      throw new Error('Failed to search profiles');
    }

    // 4. For email search, we need to query auth.users
    // Since we don't have direct access to auth.users from client,
    // we'll use a workaround: search by display name only
    // In production, you might use Supabase Admin API or Edge Functions

    const results: SearchResult[] = (profiles || []).map((profile) => ({
      id: profile.id,
      display_name: profile.display_name,
    }));

    // 5. Return results
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
