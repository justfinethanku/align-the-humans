import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { afterEach, beforeEach, test } from 'node:test';
import {
  planAuthEmail,
  verifySupabaseHookPayload,
  type WebhookHeaderSource,
} from './hook';

const APP_URL = 'https://alignthehumans.com';
const TOKEN_HASH = 'token-hash-for-tests';
const NOW_SECONDS = 1_760_000_000;

let previousSecret: string | undefined;

function headerSource(
  headers: Record<string, string | undefined>
): WebhookHeaderSource {
  return {
    get(name: string) {
      const match = Object.entries(headers).find(
        ([key]) => key.toLowerCase() === name.toLowerCase()
      );
      return match?.[1] ?? null;
    },
  };
}

function signingKeyFromSecret(secret: string): Buffer {
  const encoded = secret.split(',').find((part) => part.startsWith('whsec_'));
  if (!encoded) throw new Error('test secret is missing a whsec_ segment');
  return Buffer.from(encoded.slice('whsec_'.length), 'base64');
}

function standardSignature(
  secret: string,
  messageId: string,
  timestampSeconds: number,
  rawBody: string
): string {
  const mac = createHmac('sha256', signingKeyFromSecret(secret))
    .update(`${messageId}.${timestampSeconds}.${rawBody}`)
    .digest('base64');
  return `v1,${mac}`;
}

function obsoleteBodySignature(secret: string, rawBody: string): string {
  return createHmac('sha256', signingKeyFromSecret(secret))
    .update(rawBody)
    .digest('base64');
}

function hookBody(emailActionType: string): string {
  return JSON.stringify({
    user: { email: 'person@example.com' },
    email_data: {
      token_hash: TOKEN_HASH,
      redirect_to: `${APP_URL}/dashboard`,
      email_action_type: emailActionType,
    },
  });
}

function signedHeaders(
  secret: string,
  rawBody: string,
  timestampSeconds: number
): WebhookHeaderSource {
  return headerSource({
    'webhook-id': 'msg_test',
    'webhook-timestamp': String(timestampSeconds),
    'webhook-signature': standardSignature(
      secret,
      'msg_test',
      timestampSeconds,
      rawBody
    ),
  });
}

beforeEach(() => {
  previousSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  const key = randomBytes(32).toString('base64');
  process.env.SUPABASE_AUTH_HOOK_SECRET = `v1,whsec_${key}`;
});

afterEach(() => {
  if (previousSecret === undefined) {
    delete process.env.SUPABASE_AUTH_HOOK_SECRET;
  } else {
    process.env.SUPABASE_AUTH_HOOK_SECRET = previousSecret;
  }
});

test('accepts a current Standard Webhooks signature', () => {
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET ?? '';
  const rawBody = hookBody('recovery');
  const timestamp = NOW_SECONDS - 30;
  const result = verifySupabaseHookPayload(
    rawBody,
    signedHeaders(secret, rawBody, timestamp),
    { nowSeconds: NOW_SECONDS, nodeEnv: 'production' }
  );

  assert.equal(result.verified, true);
  if (!result.verified) return;
  assert.deepEqual(JSON.parse(rawBody), result.payload);
});

test('rejects a request missing the Standard Webhooks headers', () => {
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET ?? '';
  const rawBody = hookBody('recovery');
  const result = verifySupabaseHookPayload(
    rawBody,
    headerSource({
      'x-supabase-webhook-signature': obsoleteBodySignature(secret, rawBody),
    }),
    { nowSeconds: NOW_SECONDS, nodeEnv: 'production' }
  );

  assert.equal(result.verified, false);
  if (result.verified) return;
  assert.equal(result.status, 401);
  assert.equal(result.message, 'Missing webhook signature');
});

test('rejects a wrong signature', () => {
  const rawBody = hookBody('recovery');
  const otherKey = randomBytes(32).toString('base64');
  const result = verifySupabaseHookPayload(
    rawBody,
    signedHeaders(`v1,whsec_${otherKey}`, rawBody, NOW_SECONDS),
    { nowSeconds: NOW_SECONDS, nodeEnv: 'production' }
  );

  assert.equal(result.verified, false);
  if (result.verified) return;
  assert.equal(result.status, 401);
  assert.equal(result.message, 'Invalid signature');
});

test('rejects a stale signature', () => {
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET ?? '';
  const rawBody = hookBody('recovery');
  const staleTimestamp = NOW_SECONDS - (5 * 60 + 1);
  const result = verifySupabaseHookPayload(
    rawBody,
    signedHeaders(secret, rawBody, staleTimestamp),
    { nowSeconds: NOW_SECONDS, nodeEnv: 'production' }
  );

  assert.equal(result.verified, false);
  if (result.verified) return;
  assert.equal(result.status, 401);
  assert.equal(result.message, 'Stale webhook signature');
});

test('rejects a timestamp newer than the 5 minute tolerance', () => {
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET ?? '';
  const rawBody = hookBody('recovery');
  const futureTimestamp = NOW_SECONDS + (5 * 60 + 1);
  const result = verifySupabaseHookPayload(
    rawBody,
    signedHeaders(secret, rawBody, futureTimestamp),
    { nowSeconds: NOW_SECONDS, nodeEnv: 'production' }
  );

  assert.equal(result.verified, false);
  if (result.verified) return;
  assert.equal(result.status, 401);
  assert.equal(result.message, 'Stale webhook signature');
});

test('fails closed in production when the hook secret is not configured', () => {
  delete process.env.SUPABASE_AUTH_HOOK_SECRET;
  const result = verifySupabaseHookPayload(hookBody('signup'), headerSource({}), {
    nowSeconds: NOW_SECONDS,
    nodeEnv: 'production',
  });

  assert.equal(result.verified, false);
  if (result.verified) return;
  assert.equal(result.status, 500);
  assert.equal(result.message, 'webhook secret not configured');
});

test('plans each auth email type the route handles', () => {
  const cases = [
    {
      emailActionType: 'signup',
      template: 'confirm',
      subject: 'Confirm your email — Human Alignment',
      type: 'signup',
      redirect: `${APP_URL}/dashboard`,
    },
    {
      emailActionType: 'email_change',
      template: 'confirm',
      subject: 'Confirm your email — Human Alignment',
      type: 'email_change',
      redirect: `${APP_URL}/dashboard`,
    },
    {
      emailActionType: 'magiclink',
      template: 'magiclink',
      subject: 'Sign in to Human Alignment',
      type: 'magiclink',
      redirect: `${APP_URL}/dashboard`,
    },
    {
      emailActionType: 'recovery',
      template: 'reset',
      subject: 'Reset your password — Human Alignment',
      type: 'recovery',
      redirect: `${APP_URL}/auth/reset-password`,
    },
    {
      emailActionType: 'invite',
      template: 'confirm',
      subject: 'Action required — Human Alignment',
      type: 'invite',
      redirect: `${APP_URL}/dashboard`,
    },
    {
      emailActionType: 'reauthentication',
      template: 'confirm',
      subject: 'Action required — Human Alignment',
      type: 'reauthentication',
      redirect: `${APP_URL}/dashboard`,
    },
  ] as const;

  for (const emailCase of cases) {
    const plan = planAuthEmail({
      emailActionType: emailCase.emailActionType,
      tokenHash: TOKEN_HASH,
      redirectTo: `${APP_URL}/dashboard`,
      appUrl: APP_URL,
    });
    const url = new URL(plan.url);

    assert.equal(plan.template, emailCase.template, emailCase.emailActionType);
    assert.equal(plan.subject, emailCase.subject, emailCase.emailActionType);
    assert.equal(url.origin + url.pathname, `${APP_URL}/auth/callback`);
    assert.equal(url.searchParams.get('token_hash'), TOKEN_HASH);
    assert.equal(url.searchParams.get('type'), emailCase.type);
    assert.equal(url.searchParams.get('redirect_to'), emailCase.redirect);
  }
});
