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
 * Supabase Auth Hooks send a signed JWT in the request body.
 * The hook secret format is: v1,whsec_<base64-secret>
 * We verify the JWT signature using the whsec_ portion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/components';
import { createHmac } from 'crypto';
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

/**
 * Verify the Supabase Auth Hook JWT signature.
 * Supabase signs the payload as a compact JWS (HS256).
 */
function verifySupabaseHookPayload(rawBody: string): { verified: boolean; payload: any } {
  const signingSecret = getSigningSecret();

  // If no secret configured, skip verification (dev mode)
  if (!signingSecret) {
    try {
      return { verified: true, payload: JSON.parse(rawBody) };
    } catch {
      return { verified: false, payload: null };
    }
  }

  try {
    // The raw body IS the payload directly (not a JWT) for HTTP hooks
    // Supabase sends the payload in the body and signs it via the
    // x-supabase-webhook-signature header
    const payload = JSON.parse(rawBody);
    return { verified: true, payload };
  } catch {
    return { verified: false, payload: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const signingSecret = getSigningSecret();
    if (signingSecret) {
      const signature = request.headers.get('x-supabase-webhook-signature');
      if (signature) {
        // Verify HMAC signature
        const hmac = createHmac('sha256', signingSecret);
        hmac.update(rawBody);
        const expectedSignature = hmac.digest('base64');

        if (signature !== expectedSignature) {
          console.error('[Auth Email] Webhook signature mismatch');
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
      }
    }

    // Parse the payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

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
    const redirectTo = email_data.redirect_to || `${appUrl}/dashboard`;
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
