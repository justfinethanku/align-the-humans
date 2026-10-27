import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkRateLimit, createMemoryRateLimitStore } from './rate-limit';
import {
  PARTNER_SEARCH_RATE_LIMIT,
  findExactEmailUserId,
  normalizeExactEmail,
  type EmailCandidate,
} from './partner-search';

const USERS: EmailCandidate[] = [
  { id: 'self', email: 'me@example.com' },
  { id: 'jo', email: 'Jo@Example.com' },
  { id: 'other', email: 'other@example.com' },
  { id: 'lookalike', email: 'notjo@example.com' },
  { id: 'suffix', email: 'jo@example.com.evil' },
  { id: 'prefix', email: 'xjo@example.com' },
  { id: 'blank', email: null },
];

test('normalizeExactEmail accepts a full address and lowercases it', () => {
  assert.equal(normalizeExactEmail('  Jo@Example.COM '), 'jo@example.com');
  assert.equal(normalizeExactEmail('partner+tag@mail.example.com'), 'partner+tag@mail.example.com');
});

test('normalizeExactEmail rejects fragments, names, and partial addresses', () => {
  for (const query of ['', 'j', 'jo', 'jo@', 'jo@example', 'Jo Smith', 'name jo@example.com', '%', 'jo@example.com extra']) {
    assert.equal(normalizeExactEmail(query), null, query);
  }
});

test('findExactEmailUserId matches the full address case-insensitively', () => {
  assert.equal(findExactEmailUserId(USERS, 'jo@example.com', 'self'), 'jo');
});

test('findExactEmailUserId does not match substrings or the caller', () => {
  assert.equal(findExactEmailUserId(USERS, 'jo@', 'self'), null);
  assert.equal(findExactEmailUserId(USERS, 'example.com', 'self'), null);
  assert.equal(findExactEmailUserId(USERS, 'notjo@example.com', 'self'), 'lookalike');
  assert.equal(findExactEmailUserId(USERS, 'jo@example.com.evil', 'self'), 'suffix');
  assert.equal(findExactEmailUserId(USERS, 'me@example.com', 'self'), null);
  assert.equal(findExactEmailUserId(USERS, 'missing@example.com', 'self'), null);
});

test('partner search rate limit blocks the call past the budget', async () => {
  const store = createMemoryRateLimitStore();
  const key = `partners.search.test:${Date.now()}:${Math.random()}`;
  for (let i = 0; i < PARTNER_SEARCH_RATE_LIMIT.limit; i += 1) {
    const result = await checkRateLimit(key, PARTNER_SEARCH_RATE_LIMIT, store);
    assert.equal(result.ok, true);
  }
  const blocked = await checkRateLimit(key, PARTNER_SEARCH_RATE_LIMIT, store);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfter >= 1);
});

test('partner search route no longer substring-matches and is rate limited', () => {
  const source = readFileSync('app/api/partners/search/route.ts', 'utf8');
  assert.equal(source.includes('.ilike('), false);
  assert.equal(source.includes('.includes('), false);
  assert.equal(source.includes('checkRateLimit'), true);
  assert.equal(source.includes('normalizeExactEmail'), true);
  assert.equal(source.includes('findExactEmailUserId'), true);
  assert.equal(source.includes('createAdminClient'), true);
});
