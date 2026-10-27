import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  createMemoryRateLimitStore,
  checkRateLimit,
} from './rate-limit';
import {
  OPS_ALERT_WINDOW_MS,
  buildOpsAlert,
  isAuthEmailAlertStatus,
  parseOpsAlertRecipients,
  redactOpsAlertText,
  reportOpsAlert,
  type OpsAlertMessage,
} from './ops-alert';

const NOW = Math.floor(1_761_600_000_000 / OPS_ALERT_WINDOW_MS) * OPS_ALERT_WINDOW_MS;

afterEach(() => {
  delete process.env.OPS_ALERT_EMAIL;
});

test('auth email alerts are 401 and 500 only', () => {
  assert.equal(isAuthEmailAlertStatus(401), true);
  assert.equal(isAuthEmailAlertStatus(500), true);
  assert.equal(isAuthEmailAlertStatus(400), false);
  assert.equal(isAuthEmailAlertStatus(429), false);
  assert.equal(isAuthEmailAlertStatus(200), false);
});

test('parses a comma-separated recipient list and drops unusable entries', () => {
  assert.deepEqual(
    parseOpsAlertRecipients(' Ops@Example.com, not-an-email, ops@example.com ,, second@example.com '),
    ['ops@example.com', 'second@example.com']
  );
  assert.deepEqual(parseOpsAlertRecipients(undefined), []);
  assert.deepEqual(parseOpsAlertRecipients('   '), []);
});

test('redacts addresses and hook or resend secrets', () => {
  const redacted = redactOpsAlertText(
    'send to Ada@Example.com failed whsec_abcDEF123= re_1234567890'
  );
  assert.equal(redacted.includes('Ada@Example.com'), false);
  assert.equal(redacted.includes('whsec_'), false);
  assert.equal(redacted.includes('re_1234567890'), false);
  assert.match(redacted, /\[redacted-email\]/);
  assert.match(redacted, /\[redacted-secret\]/);
});

test('builds a stable alert inside one window', () => {
  const first = buildOpsAlert(
    {
      source: 'auth-email',
      status: 401,
      summary: 'Missing webhook signature',
      detail: 'user ada@example.com',
    },
    ['ops@example.com'],
    NOW
  );
  const later = buildOpsAlert(
    {
      source: 'auth-email',
      status: 401,
      summary: 'Missing webhook signature',
      detail: 'user ada@example.com',
    },
    ['ops@example.com'],
    NOW + OPS_ALERT_WINDOW_MS - 1
  );
  const nextWindow = buildOpsAlert(
    {
      source: 'auth-email',
      status: 401,
      summary: 'Missing webhook signature',
      detail: 'user ada@example.com',
    },
    ['ops@example.com'],
    NOW + OPS_ALERT_WINDOW_MS
  );

  assert.equal(first.idempotencyKey, later.idempotencyKey);
  assert.notEqual(first.idempotencyKey, nextWindow.idempotencyKey);
  assert.equal(first.subject, '[Align the Humans] auth-email 401: Missing webhook signature');
  assert.equal(first.text.includes('ada@example.com'), false);
  assert.match(first.text, /\[redacted-email\]/);
  assert.ok(first.idempotencyKey.length <= 256);
});

test('does not send when no recipient is configured', async () => {
  delete process.env.OPS_ALERT_EMAIL;
  let sends = 0;
  const result = await reportOpsAlert(
    { source: 'auth-email', status: 401, summary: 'Missing webhook signature' },
    {
      now: NOW,
      send: async () => {
        sends += 1;
        return { id: 'should-not-send' };
      },
    }
  );
  assert.deepEqual(result, { delivered: false, reason: 'unconfigured' });
  assert.equal(sends, 0);
});

test('sends the first alert and coalesces a repeat in the same window', async () => {
  const store = createMemoryRateLimitStore();
  const sent: OpsAlertMessage[] = [];
  const send = async (message: OpsAlertMessage) => {
    sent.push(message);
    return { id: 'email_1' };
  };
  const rateLimit = (
    key: string,
    opts: { limit: number; windowMs: number }
  ) => checkRateLimit(key, opts, store);

  const input = {
    source: 'resend' as const,
    status: 500,
    summary: 'Resend rejected auth email',
    detail: 'Invalid API key re_1234567890',
  };

  const first = await reportOpsAlert(input, { recipients: ['ops@example.com'], now: NOW, send, rateLimit });
  const second = await reportOpsAlert(input, { recipients: ['ops@example.com'], now: NOW + 1_000, send, rateLimit });

  assert.deepEqual(first, { delivered: true, id: 'email_1' });
  assert.deepEqual(second, { delivered: false, reason: 'coalesced' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.text.includes('re_1234567890'), false);
  assert.deepEqual(sent[0]?.to, ['ops@example.com']);
});

test('a rejected alert send does not throw or retry itself', async () => {
  const store = createMemoryRateLimitStore();
  let sends = 0;
  const result = await reportOpsAlert(
    { source: 'auth-email', status: 500, summary: 'Auth email hook threw' },
    {
      recipients: ['ops@example.com'],
      now: NOW,
      rateLimit: (key, opts) => checkRateLimit(key, opts, store),
      send: async () => {
        sends += 1;
        return { error: 'Resend unavailable' };
      },
    }
  );
  assert.equal(result.delivered, false);
  if (!result.delivered) {
    assert.equal(result.reason, 'send-failed');
    assert.match(result.error ?? '', /Resend unavailable/);
  }
  assert.equal(sends, 1);
});

test('a throwing sender is contained', async () => {
  const store = createMemoryRateLimitStore();
  const result = await reportOpsAlert(
    { source: 'auth-email', status: 500, summary: 'webhook secret not configured' },
    {
      recipients: ['ops@example.com'],
      now: NOW,
      rateLimit: (key, opts) => checkRateLimit(key, opts, store),
      send: async () => {
        throw new Error('Missing RESEND_API_KEY');
      },
    }
  );
  assert.deepEqual(result, {
    delivered: false,
    reason: 'send-failed',
    error: 'Missing RESEND_API_KEY',
  });
});
