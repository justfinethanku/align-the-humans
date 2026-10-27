/**
 * Shared rate limiter.
 *
 * Production calls `consume_rate_limit` in the existing Supabase Postgres
 * project, so every serverless instance shares one window. The function is
 * granted only to the service role. Keys are SHA-256 hex before they leave
 * the process, so the table does not store raw emails or IP addresses.
 *
 * If that call throws (function not applied yet, or the database is down),
 * this process falls back to its own memory so a limiter outage does not
 * take login or email with it. That fallback is per instance. Tests pass a
 * store and never fall back.
 */

import { createHash } from 'crypto';
import { RateLimitError } from './errors';

interface WindowState {
  timestamps: number[];
}

const MAX_TRACKED_KEYS = 5000;

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds the caller should wait before retrying (0 if ok) */
  retryAfter: number;
}

export interface RateLimitStore {
  consume(key: string, opts: RateLimitOptions, now: number): Promise<RateLimitResult>;
}

export function rateLimitStorageKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Sliding window over a map the caller owns. Two stores constructed with the
 * same map count each other's hits, which is the contract the Postgres
 * function implements across instances.
 */
export function consumeSlidingWindow(
  store: Map<string, WindowState>,
  key: string,
  opts: RateLimitOptions,
  now: number
): RateLimitResult {
  const { limit, windowMs } = opts;
  if (limit < 1) {
    return { ok: false, retryAfter: 1 };
  }

  let state = store.get(key);
  if (!state) {
    if (store.size >= MAX_TRACKED_KEYS) {
      const firstKey = store.keys().next().value;
      if (firstKey !== undefined && firstKey !== key) {
        store.delete(firstKey);
      }
    }
    state = { timestamps: [] };
    store.set(key, state);
  }

  const windowStart = now - windowMs;
  state.timestamps = state.timestamps.filter((t) => t > windowStart);

  if (state.timestamps.length >= limit) {
    const oldest = state.timestamps[0] ?? now;
    const retryAfterMs = oldest + windowMs - now;
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  state.timestamps.push(now);
  return { ok: true, retryAfter: 0 };
}

export function createSharedWindowMap(): Map<string, WindowState> {
  return new Map();
}

export function createMemoryRateLimitStore(
  shared: Map<string, WindowState> = createSharedWindowMap()
): RateLimitStore {
  return {
    async consume(key, opts, now) {
      return consumeSlidingWindow(shared, key, opts, now);
    },
  };
}

export function parseRateLimitRpcPayload(data: unknown): RateLimitResult {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    throw new Error('rate limit rpc returned no row');
  }
  const record = row as { ok?: unknown; retry_after?: unknown };
  if (typeof record.ok !== 'boolean') {
    throw new Error('rate limit rpc row missing ok');
  }
  if (record.ok) {
    return { ok: true, retryAfter: 0 };
  }
  const retryAfter = Number(record.retry_after);
  if (!Number.isFinite(retryAfter) || retryAfter < 1) {
    return { ok: false, retryAfter: 1 };
  }
  return { ok: false, retryAfter: Math.ceil(retryAfter) };
}

export function createPostgresRateLimitStore(options: {
  url: string;
  serviceRoleKey: string;
  fetchImpl?: typeof fetch;
}): RateLimitStore {
  const endpoint = `${options.url.replace(/\/$/, '')}/rest/v1/rpc/consume_rate_limit`;
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    async consume(key, opts) {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          apikey: options.serviceRoleKey,
          Authorization: `Bearer ${options.serviceRoleKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          p_key: key,
          p_limit: opts.limit,
          p_window_ms: opts.windowMs,
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 180);
        throw new Error(`rate limit rpc ${response.status}: ${detail}`);
      }
      return parseRateLimitRpcPayload(await response.json());
    },
  };
}

const memoryStore = createMemoryRateLimitStore();
let postgresStore: RateLimitStore | null = null;
let lastFallbackLog = 0;

function defaultStore(): RateLimitStore {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return memoryStore;
  }
  if (!postgresStore) {
    postgresStore = createPostgresRateLimitStore({ url, serviceRoleKey });
  }
  return postgresStore;
}

function logFallback(error: unknown) {
  const now = Date.now();
  if (now - lastFallbackLog < 60_000) return;
  lastFallbackLog = now;
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(`[rate-limit] shared store unavailable, using process memory: ${message}`);
}

/**
 * Checks (and records) a request against a sliding-window rate limit.
 *
 * @param key Unique identifier for the caller + resource being limited
 * @param opts limit / windowMs configuration
 * @param store Test double. Production leaves this unset and uses Postgres.
 */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
  store?: RateLimitStore
): Promise<RateLimitResult> {
  const storageKey = rateLimitStorageKey(key);
  const selected = store ?? defaultStore();
  try {
    return await selected.consume(storageKey, opts, Date.now());
  } catch (error) {
    if (store) throw error;
    logFallback(error);
    return memoryStore.consume(storageKey, opts, Date.now());
  }
}

/**
 * Throws RateLimitError when the shared window is full.
 */
export async function assertWithinRateLimit(
  key: string,
  opts: RateLimitOptions,
  message: string
): Promise<void> {
  const result = await checkRateLimit(key, opts);
  if (!result.ok) {
    throw new RateLimitError(message, { retryAfter: result.retryAfter });
  }
}

/**
 * Builds a per-user rate limit key scoped to a specific route/action so
 * different endpoints don't share the same bucket.
 */
export function rateLimitKeyForUser(userId: string, scope: string): string {
  return `user:${userId}:${scope}`;
}

export function clientIpFromForwarded(
  forwardedFor: string | null,
  realIp: string | null
): string {
  const forwarded = forwardedFor?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  const real = realIp?.trim();
  if (real) return real;
  return 'unknown';
}
