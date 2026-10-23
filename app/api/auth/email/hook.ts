/**
 * Supabase Send Email hook verification and template selection.
 *
 * Supabase Auth signs every HTTP auth hook with the Standard Webhooks
 * scheme: headers `webhook-id`, `webhook-timestamp`, and `webhook-signature`
 * (`v1,<base64 HMAC-SHA256>`). The signed content is
 * `${webhook-id}.${webhook-timestamp}.${rawBody}`. The hook secret is
 * `v1,whsec_<base64 key>` from SUPABASE_AUTH_HOOK_SECRET.
 *
 * This uses node:crypto rather than the standardwebhooks package. The
 * algorithm is the scheme Supabase's auth server signs with, and node:crypto
 * is already available.
 *
 * Tolerance is the Standard Webhooks default of 5 minutes in either direction.
 */

import { createHmac, timingSafeEqual } from 'crypto';

const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export type WebhookHeaderSource = {
  get(name: string): string | null;
};

export type VerifyResult =
  | { verified: true; payload: unknown }
  | { verified: false; status: number; message: string };

export type AuthEmailTemplate = 'confirm' | 'reset' | 'magiclink';

export type AuthEmailPlan = {
  subject: string;
  template: AuthEmailTemplate;
  url: string;
};

type VerifyOptions = {
  nowSeconds?: number;
  nodeEnv?: string;
};

/**
 * Extract the HMAC key from a Supabase hook secret.
 * Format: "v1,whsec_<base64-encoded-secret>"
 */
function decodeSigningSecret(hookSecret: string): Buffer | null {
  const whsecPart = hookSecret
    .trim()
    .split(',')
    .find((part) => part.startsWith('whsec_'));
  if (!whsecPart) return null;

  const encoded = whsecPart.slice('whsec_'.length);
  if (!encoded) return null;

  const key = Buffer.from(encoded, 'base64');
  if (key.length === 0) return null;
  return key;
}

function parseTimestampSeconds(header: string): number | null {
  if (!/^[0-9]+$/.test(header)) return null;
  const timestamp = Number(header);
  if (!Number.isSafeInteger(timestamp)) return null;
  return timestamp;
}

function signaturesMatch(expected: string, provided: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  return (
    expectedBuf.length === providedBuf.length &&
    timingSafeEqual(expectedBuf, providedBuf)
  );
}

/**
 * Accepts the space-separated `v1,<signature>` list from the Standard
 * Webhooks spec. Supabase joins multiple secrets with ", ", which leaves a
 * trailing comma on every signature except the last; only the segment
 * between the first and second comma is the signature, matching the
 * standardwebhooks verifiers.
 */
function hasMatchingSignature(
  signatureHeader: string,
  expectedSignature: string
): boolean {
  const passedSignatures = signatureHeader.split(' ');
  for (const versionedSignature of passedSignatures) {
    const [version, signature] = versionedSignature.split(',');
    if (version !== 'v1' || !signature) continue;
    if (signaturesMatch(expectedSignature, signature)) return true;
  }
  return false;
}

/**
 * Verifies a Supabase Send Email hook payload.
 * Fails closed: a missing or unusable secret, or a missing, invalid, or
 * stale signature, never returns `verified: true` in production.
 */
export function verifySupabaseHookPayload(
  rawBody: string,
  headers: WebhookHeaderSource,
  options: VerifyOptions = {}
): VerifyResult {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const signingSecret = decodeSigningSecret(
    process.env.SUPABASE_AUTH_HOOK_SECRET ?? ''
  );

  if (!signingSecret) {
    if (nodeEnv === 'production') {
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

  const messageId = headers.get('webhook-id');
  const timestampHeader = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');

  if (!messageId || !timestampHeader || !signatureHeader) {
    return {
      verified: false,
      status: 401,
      message: 'Missing webhook signature',
    };
  }

  const timestampSeconds = parseTimestampSeconds(timestampHeader);
  if (timestampSeconds === null) {
    return { verified: false, status: 401, message: 'Invalid signature' };
  }

  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const outsideTolerance =
    nowSeconds - timestampSeconds > WEBHOOK_TOLERANCE_SECONDS ||
    timestampSeconds > nowSeconds + WEBHOOK_TOLERANCE_SECONDS;
  if (outsideTolerance) {
    return {
      verified: false,
      status: 401,
      message: 'Stale webhook signature',
    };
  }

  const expectedSignature = createHmac('sha256', signingSecret)
    .update(`${messageId}.${timestampSeconds}.${rawBody}`)
    .digest('base64');

  if (!hasMatchingSignature(signatureHeader, expectedSignature)) {
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
 * absolute https URLs whose host matches the app URL. Anything else
 * (off-site hosts, protocol-relative "//" URLs, backslash-prefixed paths,
 * non-https schemes) is dropped in favor of a safe default.
 */
export function sanitizeRedirectTo(redirectTo: unknown, appUrl: string): string {
  const fallback = `${appUrl}/dashboard`;

  if (typeof redirectTo !== 'string' || redirectTo.length === 0) {
    return fallback;
  }

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
    // Not a parseable absolute URL — fall through to the default below.
  }

  console.warn('[Auth Email] Rejected off-site redirect_to:', redirectTo);
  return fallback;
}

/**
 * Chooses the subject, template, and action URL for one auth email.
 * Signature verification happens before this runs, so every action type
 * that reaches the route shares that gate.
 *
 * `invite` and `reauthentication` have no dedicated template and use the
 * confirm fallback. Supabase Auth invite emails are distinct from alignment
 * partner invites, which are sent directly through Resend.
 */
export function planAuthEmail(input: {
  emailActionType: string;
  tokenHash: string | undefined;
  redirectTo: unknown;
  appUrl: string;
}): AuthEmailPlan {
  const { emailActionType, tokenHash, appUrl } = input;
  const redirectTo = sanitizeRedirectTo(input.redirectTo, appUrl);

  switch (emailActionType) {
    case 'signup':
    case 'email_change': {
      const type = emailActionType === 'signup' ? 'signup' : 'email_change';
      return {
        template: 'confirm',
        subject: 'Confirm your email — Human Alignment',
        url: `${appUrl}/auth/callback?token_hash=${tokenHash}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`,
      };
    }

    case 'recovery':
      return {
        template: 'reset',
        subject: 'Reset your password — Human Alignment',
        url: `${appUrl}/auth/callback?token_hash=${tokenHash}&type=recovery&redirect_to=${encodeURIComponent(`${appUrl}/auth/reset-password`)}`,
      };

    case 'magiclink':
      return {
        template: 'magiclink',
        subject: 'Sign in to Human Alignment',
        url: `${appUrl}/auth/callback?token_hash=${tokenHash}&type=magiclink&redirect_to=${encodeURIComponent(redirectTo)}`,
      };

    default:
      return {
        template: 'confirm',
        subject: 'Action required — Human Alignment',
        url: `${appUrl}/auth/callback?token_hash=${tokenHash}&type=${emailActionType}&redirect_to=${encodeURIComponent(redirectTo)}`,
      };
  }
}
