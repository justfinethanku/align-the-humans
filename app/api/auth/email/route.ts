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
 * Supabase signs the raw JSON body with the Standard Webhooks scheme
 * (webhook-id, webhook-timestamp, webhook-signature) using
 * SUPABASE_AUTH_HOOK_SECRET. See app/api/auth/email/hook.ts.
 *
 * SECURITY: Signature verification is mandatory. If SUPABASE_AUTH_HOOK_SECRET
 * is configured, a request with a missing, invalid, or stale signature is
 * rejected (401). If SUPABASE_AUTH_HOOK_SECRET is not configured at all, the
 * endpoint fails closed in production (500) rather than silently accepting
 * unsigned payloads — this endpoint can send email as Human Alignment's
 * Resend account to any address an attacker supplies, so it must never
 * process an unverified request in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/components';
import { getResendClient, FROM_EMAIL, getAppUrl } from '@/app/lib/resend';
import { AuthConfirmEmail } from '@/app/lib/emails/auth-confirm';
import { PasswordResetEmail } from '@/app/lib/emails/password-reset';
import { MagicLinkEmail } from '@/app/lib/emails/magic-link';
import { checkRateLimit, clientIpFromForwarded } from '@/app/lib/rate-limit';
import { planAuthEmail, verifySupabaseHookPayload } from './hook';

type HookUser = {
  email?: unknown;
};

type HookEmailData = {
  token_hash?: unknown;
  redirect_to?: unknown;
  email_action_type?: unknown;
};

type HookPayload = {
  user?: HookUser;
  email_data?: HookEmailData;
};

function isHookPayload(payload: unknown): payload is HookPayload {
  return typeof payload === 'object' && payload !== null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const verifyResult = verifySupabaseHookPayload(rawBody, request.headers);
    if (!verifyResult.verified) {
      console.error(`[Auth Email] Verification failed: ${verifyResult.message}`);
      if (verifyResult.status === 401) {
        const ip = clientIpFromForwarded(
          request.headers.get('x-forwarded-for'),
          request.headers.get('x-real-ip')
        );
        const invalidLimit = await checkRateLimit(`ip:${ip}:auth-email.invalid`, {
          limit: 30,
          windowMs: 60_000,
        });
        if (!invalidLimit.ok) {
          return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': String(invalidLimit.retryAfter) } }
          );
        }
      }
      return NextResponse.json(
        { error: verifyResult.message },
        { status: verifyResult.status }
      );
    }

    const payload = isHookPayload(verifyResult.payload)
      ? verifyResult.payload
      : null;
    const user = payload?.user;
    const emailData = payload?.email_data;

    if (!user || typeof user.email !== 'string' || !emailData) {
      console.error(
        '[Auth Email] Invalid payload structure:',
        JSON.stringify(payload).slice(0, 200)
      );
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const recipientLimit = await checkRateLimit(`email:${user.email.toLowerCase()}:auth-email`, {
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!recipientLimit.ok) {
      console.error('[Auth Email] Recipient rate limit reached');
      return NextResponse.json(
        { error: 'Too many emails for this address' },
        { status: 429, headers: { 'Retry-After': String(recipientLimit.retryAfter) } }
      );
    }

    const appUrl = getAppUrl();
    const resend = getResendClient();
    const tokenHash =
      typeof emailData.token_hash === 'string' ? emailData.token_hash : undefined;
    const emailActionType =
      typeof emailData.email_action_type === 'string'
        ? emailData.email_action_type
        : '';

    const plan = planAuthEmail({
      emailActionType,
      tokenHash,
      redirectTo: emailData.redirect_to,
      appUrl,
    });

    let html: string;
    switch (plan.template) {
      case 'reset':
        html = await render(PasswordResetEmail({ resetUrl: plan.url, appUrl }));
        break;
      case 'magiclink':
        html = await render(
          MagicLinkEmail({ magicLinkUrl: plan.url, appUrl })
        );
        break;
      case 'confirm':
        html = await render(
          AuthConfirmEmail({ confirmUrl: plan.url, appUrl })
        );
        break;
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: plan.subject,
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
