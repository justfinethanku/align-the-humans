/**
 * Admin API: Model Discovery
 *
 * GET /api/admin/models
 *
 * Returns available AI models from the Vercel AI Gateway.
 * Requires admin authentication.
 */

import { NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { discoverModels, discoverAnthropicModels } from '@/app/lib/ai-config';

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = createServerClient();
    const user = await requireAuth(supabase);

    // Verify admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Check for provider filter
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');

    const models = provider === 'anthropic'
      ? await discoverAnthropicModels()
      : await discoverModels();

    return NextResponse.json({
      models,
      count: models.length,
      source: process.env.AI_GATEWAY_API_KEY ? 'gateway' : 'defaults',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
