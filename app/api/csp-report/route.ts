/**
 * POST /api/csp-report
 *
 * Browser reports for the enforced Content-Security-Policy.
 * Accepts the legacy application/csp-report body and the Reporting API array.
 * The body is logged in a short redacted form and not stored.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientIpFromForwarded } from '@/app/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_BODY = 8_000;
const MAX_FIELD = 180;

function field(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return '';
  const withoutQuery = value.split('?')[0] ?? value;
  return withoutQuery.slice(0, MAX_FIELD);
}

function summarizeReport(report: unknown): string {
  if (!report || typeof report !== 'object') return 'unparsed';
  const record = report as Record<string, unknown>;
  const parts = [
    field(record['violated-directive'] ?? record.violatedDirective),
    field(record['effective-directive'] ?? record.effectiveDirective),
    field(record['blocked-uri'] ?? record.blockedURL ?? record.blockedUri),
    field(record.disposition),
  ].filter((part) => part.length > 0);
  return parts.join(' ') || 'empty';
}

function summarize(payload: unknown): string {
  if (Array.isArray(payload)) {
    return payload
      .slice(0, 3)
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return 'unparsed';
        const body = (entry as { body?: unknown }).body ?? entry;
        return summarizeReport(body);
      })
      .join(' | ');
  }
  if (payload && typeof payload === 'object' && 'csp-report' in payload) {
    return summarizeReport((payload as { 'csp-report': unknown })['csp-report']);
  }
  return summarizeReport(payload);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIpFromForwarded(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip')
  );

  try {
    const limit = await checkRateLimit(`ip:${ip}:csp-report`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return new NextResponse(null, {
        status: 204,
        headers: { 'Retry-After': String(limit.retryAfter) },
      });
    }
  } catch (error) {
    console.error('[csp] rate limit check failed', error);
  }

  const raw = await request.text();
  let summary = 'unparsed';
  if (raw.length > 0 && raw.length <= MAX_BODY) {
    try {
      summary = summarize(JSON.parse(raw));
    } catch {
      summary = 'invalid-json';
    }
  } else if (raw.length > MAX_BODY) {
    summary = 'oversized';
  }

  console.warn(`[csp] ${summary}`);
  return new NextResponse(null, { status: 204 });
}
