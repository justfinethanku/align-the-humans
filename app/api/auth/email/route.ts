/**
 * Supabase Auth Email Hook
 *
 * POST /api/auth/email
 *
 * Supabase Auth calls this endpoint to send emails via Resend
 * instead of its built-in SMTP mailer.
 *
 * Configure in Supabase Dashboard:
 *   Authentication → Hooks → Send Email → HTTP endpoint
 *   URL: https://alignthehumans.com/api/auth/email
 *
 * Supabase Auth Hooks send the raw JSON payload in the request body and
 * sign it via the `x-supabase-webhook-signature` header (HMAC-SHA256,
 * base64-encoded, computed over the raw body using the `whsec_` secret
 * portion of SUPABASE_AUTH_HOOK_SECRET). Verify this header format against
 * current Supabase Auth Hooks docs before changing the verification method.
 *
 * SECURITY: Signature verification is mandatory. If SUPABASE_AUTH_HOOK_SECRET
 * is configured, a request with a missing or invalid signature is rejected
 * (401). If SUPABASE_AUTH_HOOK_SECRET is not configured at all, the endpoint
 * fails closed in production (500) rather than silently accepting unsigned
 * payloads — this endpoint can send email as Human Alignment's Resend
 * account to any address an attacker supplies, so it must never process an
 * unverified request in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/components';
import { createHmac, timingSafeEqual } from 'crypto';
import { getResendClient, FROM_EMAIL, getAppUrl } from '@/app/lib/resend';
import { AuthConfirmEmail } from '@/app/lib/emails/auth-confirm';
import { PasswordResetEmail } from '@/app/lib/emails/password-reset';
import { MagicLinkEmail } from '@/app/lib/emails/magic-link';

/**
 * Extract the signing secret from the Supabase hook secret.
 * Format: "v1,whsec_<base64-encoded-secret>"
 */
function getSigningSecret(): Buffer | null {
  const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  if (!hookSecret) return null;

  // Extract the whsec_ portion
  const parts = hookSecret.split(',');
  const whsecPart = parts.find(p => p.startsWith('whsec_'));
  if (!whsecPart) return null;

  const base64Secret = whsecPart.replace('whsec_', '');
  return Buffer.from(base64Secret, 'base64');
}

type VerifyResult =
  | { verified: true; payload: any }
  | { verified: false; status: number; message: string };

/**
 * Verifies the Supabase Auth Hook webhook signature and parses the payload.
 * Fails closed: any missing/misconfigured secret or missing/invalid
 * signature results in `verified: false` rather than falling through to a
 * "verified" state.
 */
function verifySupabaseHookPayload(
  rawBody: string,
  signatureHeader: string | null
): VerifyResult {
  const signingSecret = getSigningSecret();

  if (!signingSecret) {
    // No secret configured at all. Only acceptable outside production
    // (local dev convenience). In production this must fail closed.
    if (process.env.NODE_ENV === 'production') {
      return {
        verified: false,
        status: 500,
        message: 'webhook secret not configured',
      };
    }

    try {
      return { verified: true, payload: JSON.parse(rawBody) };
    } catch {
      return { verified: false, status: 400, message: 'Invalid JSON payload' };
    }
  }

  // A secret IS configured — the signature header is mandatory. Missing
  // header must NOT be treated as verified.
  if (!signatureHeader) {
    return {
      verified: false,
      status: 401,
      message: 'Missing webhook signature',
    };
  }

  const hmac = createHmac('sha256', signingSecret);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('base64');

  const providedBuf = Buffer.from(signatureHeader);
  const expectedBuf = Buffer.from(expectedSignature);
  const signaturesMatch =
    providedBuf.length === expectedBuf.length &&
    timingSafeEqual(providedBuf, expectedBuf);

  if (!signaturesMatch) {
    return { verified: false, status: 401, message: 'Invalid signature' };
  }

  try {
    return { verified: true, payload: JSON.parse(rawBody) };
  } catch {
    return { verified: false, status: 400, message: 'Invalid JSON payload' };
  }
}

/**
 * Ensures a redirect target is same-site before it's embedded into an
 * outbound email link. Accepts relative paths (single leading "/") or
 * absolute https URLs whose host matches NEXT_PUBLIC_APP_URL. Anything else
 * (off-site hosts, protocol-relative "//" URLs, backslash-prefixed paths,
 * non-https schemes) is dropped in favor of a safe default.
 */
function sanitizeRedirectTo(redirectTo: unknown, appUrl: string): string {
  const fallback = `${appUrl}/dashboard`;

  if (typeof redirectTo !== 'string' || redirectTo.length === 0) {
    return fallback;
  }

  // Relative path — but reject protocol-relative "//host" values and
  // backslash-prefixed values ("/\evil.com"), both of which browsers'
  // URL parsers treat as protocol-relative/absolute for special schemes
  // even though they start with a single "/".
  if (
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//') &&
    !redirectTo.startsWith('/\\')
  ) {
    return redirectTo;
  }

  try {
    const target = new URL(redirectTo);
    const allowed = new URL(appUrl);
    if (target.protocol === 'https:' && target.host === allowed.host) {
      return redirectTo;
    }
  } catch {
    // Not a parseable absolute URL — fall through to default below.
  }

  console.warn('[Auth Email] Rejected off-site redirect_to:', redirectTo);
  return fallback;
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('x-supabase-webhook-signature');

    const verifyResult = verifySupabaseHookPayload(rawBody, signatureHeader);
    if (!verifyResult.verified) {
      console.error(`[Auth Email] Verification failed: ${verifyResult.message}`);
      return NextResponse.json(
        { error: verifyResult.message },
        { status: verifyResult.status }
      );
    }

    const payload = verifyResult.payload;

    const { user, email_data } = payload;

    if (!user?.email || !email_data) {
      console.error('[Auth Email] Invalid payload structure:', JSON.stringify(payload).slice(0, 200));
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const appUrl = getAppUrl();
    const resend = getResendClient();

    // Build the confirmation/action URL
    // Supabase provides token_hash for PKCE flow
    const tokenHash = email_data.token_hash;
    const redirectTo = sanitizeRedirectTo(email_data.redirect_to, appUrl);
    const emailActionType = email_data.email_action_type;

    let subject: string;
    let html: string;

    switch (emailActionType) {
      case 'signup':
      case 'email_change': {
        const confirmUrl = `${appUrl}/auth/callback?token_hash=${tokenHash}&type=${emailActionType === 'signup' ? 'signup' : 'email_change'}&redirect_to=${encodeURIComponent(redirectTo)}`;
        subject = 'Confirm your email — Human Alignment';
        html = await render(AuthConfirmEmail({ confirmUrl, appUrl }));
        break;
      }

      case 'recovery': {
        const resetUrl = `${appUrl}/auth/callback?token_hash=${tokenHash}&type=recovery&redirect_to=${encodeURIComponent(`${appUrl}/auth/reset-password`)}`;
        subject = 'Reset your password — Human Alignment';
        html = await render(PasswordResetEmail({ resetUrl, appUrl }));
        break;
      }

      case 'magiclink': {
        const magicLinkUrl = `${appUrl}/auth/callback?token_hash=${tokenHash}&type=magiclink&redirect_to=${encodeURIComponent(redirectTo)}`;
        subject = 'Sign in to Human Alignment';
        html = await render(MagicLinkEmail({ magicLinkUrl, appUrl }));
        break;
      }

      default: {
        // Fallback for unknown types - use confirm template
        const fallbackUrl = `${appUrl}/auth/callback?token_hash=${tokenHash}&type=${emailActionType}&redirect_to=${encodeURIComponent(redirectTo)}`;
        subject = 'Action required — Human Alignment';
        html = await render(AuthConfirmEmail({ confirmUrl: fallbackUrl, appUrl }));
      }
    }

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject,
      html,
    });

    if (error) {
      console.error(`[Auth Email] Failed to send ${emailActionType} email:`, error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log(`[Auth Email] Sent ${emailActionType} email to ${user.email}, id: ${data?.id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Auth Email] Webhook error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
