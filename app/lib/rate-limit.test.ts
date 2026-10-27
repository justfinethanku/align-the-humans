import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  checkRateLimit,
  createMemoryRateLimitStore,
  createPostgresRateLimitStore,
  createSharedWindowMap,
  parseRateLimitRpcPayload,
  rateLimitStorageKey,
} from './rate-limit';

test('a second instance blocks the request that exceeds a shared window', async () => {
  const shared = createSharedWindowMap();
  const instanceA = createMemoryRateLimitStore(shared);
  const instanceB = createMemoryRateLimitStore(shared);
  const opts = { limit: 3, windowMs: 60_000 };
  const start = 1_700_000_000_000;

  assert.equal((await instanceA.consume('login', opts, start)).ok, true);
  assert.equal((await instanceA.consume('login', opts, start + 5)).ok, true);
  assert.equal((await instanceB.consume('login', opts, start + 10)).ok, true);

  const blocked = await instanceB.consume('login', opts, start + 15);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfter >= 1);
  assert.equal((await instanceB.consume('other-route', opts, start)).ok, true);
});

test('checkRateLimit records into the shared store and blocks the next call', async () => {
  const shared = createSharedWindowMap();
  const store = createMemoryRateLimitStore(shared);
  const opts = { limit: 2, windowMs: 60_000 };
  const key = 'partners.search.shared';

  assert.equal((await checkRateLimit(key, opts, store)).ok, true);
  assert.equal((await checkRateLimit(key, opts, store)).ok, true);
  const blocked = await checkRateLimit(key, opts, store);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfter >= 1);

  const otherInstance = createMemoryRateLimitStore(shared);
  const seenByOther = await otherInstance.consume(rateLimitStorageKey(key), opts, Date.now());
  assert.equal(seenByOther.ok, false);
});

test('postgres store blocks when the shared function says the window is full', async () => {
  let hits = 0;
  const requests: { url: string; body: string; authorization: string | null }[] = [];
  const store = createPostgresRateLimitStore({
    url: 'https://example.supabase.co/',
    serviceRoleKey: 'service-role-test',
    fetchImpl: async (url, init) => {
      hits += 1;
      const headers = new Headers(init?.headers);
      requests.push({
        url: String(url),
        body: String(init?.body ?? ''),
        authorization: headers.get('authorization'),
      });
      const ok = hits <= 2;
      return new Response(JSON.stringify([{ ok, retry_after: ok ? 0 : 9 }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });
  const opts = { limit: 2, windowMs: 60_000 };

  assert.equal((await store.consume('hashed-key', opts, 0)).ok, true);
  assert.equal((await store.consume('hashed-key', opts, 0)).ok, true);
  const blocked = await store.consume('hashed-key', opts, 0);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfter, 9);
  assert.equal(requests[0]?.url, 'https://example.supabase.co/rest/v1/rpc/consume_rate_limit');
  assert.equal(requests[0]?.authorization, 'Bearer service-role-test');
  assert.match(requests[0]?.body ?? '', /"p_limit":2/);
  assert.match(requests[0]?.body ?? '', /"p_window_ms":60000/);
});

test('parseRateLimitRpcPayload reads a row from consume_rate_limit', () => {
  assert.deepEqual(parseRateLimitRpcPayload([{ ok: true, retry_after: 0 }]), {
    ok: true,
    retryAfter: 0,
  });
  assert.deepEqual(parseRateLimitRpcPayload({ ok: false, retry_after: 4 }), {
    ok: false,
    retryAfter: 4,
  });
});

test('content security policy is enforced and reports to the app', () => {
  const source = readFileSync('next.config.js', 'utf8');
  assert.equal(source.includes('Content-Security-Policy-Report-Only'), false);
  assert.equal(source.includes("key: 'Content-Security-Policy'"), true);
  assert.equal(source.includes('report-uri /api/csp-report'), true);
  assert.match(source, /script-src 'self' 'unsafe-inline'/);
  assert.match(source, /style-src 'self' 'unsafe-inline'/);
  assert.match(source, /font-src 'self'/);
  assert.match(source, /https:\/\/\*\.supabase\.co/);
  assert.match(source, /wss:\/\/\*\.supabase\.co/);
  assert.match(source, /https:\/\/openrouter\.ai/);
  assert.match(source, /https:\/\/ai-gateway\.vercel\.sh/);
});
