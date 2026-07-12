import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { DatabaseError, ValidationError, createErrorResponse } from '@/app/lib/errors'
import { createServerClient, requireAuth } from '@/app/lib/supabase-server'

const UpgradeInterestSchema = z.object({
  tier: z.enum(['alignment_pass', 'pro', 'team']),
  context: z.string().trim().min(1).max(120),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createServerClient()

  try {
    const user = await requireAuth(supabase)
    let body: unknown

    try {
      body = await request.json()
    } catch {
      throw new ValidationError('Request body must be valid JSON')
    }

    const parsed = UpgradeInterestSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid upgrade-interest request', {
        errors: parsed.error.format(),
      })
    }

    const { error } = await supabase.from('upgrade_interest').insert({
      user_id: user.id,
      tier: parsed.data.tier,
      context: parsed.data.context,
    })

    if (error) {
      throw new DatabaseError('Could not record upgrade interest', {
        databaseMessage: error.message,
      })
    }

    return NextResponse.json({ data: { recorded: true } }, { status: 201 })
  } catch (error) {
    return createErrorResponse(error) as NextResponse
  }
}
