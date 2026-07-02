/**
 * In-Memory Rate Limiter
 *
 * IN-MEMORY ONLY — resets per serverless instance. For production, back this
 * with Vercel KV / Upstash Redis (see runbook).
 *
 * Implements a simple sliding-window limiter keyed by an arbitrary string
 * (typically a user id + route). State is held in a module-level Map, which
 * means limits are only enforced per-instance/per-process — on serverless
 * platforms with multiple concurrent instances (or cold starts), the
 * effective limit can be higher than configured. This is acceptable as a
 * first line of defense against casual abuse, not as a hard guarantee.
 */

interface WindowState {
  /** Timestamps (ms) of requests within the current window */
  timestamps: number[];
}

const store = new Map<string, WindowState>();

// Periodically clear out fully-expired entries so the Map doesn't grow
// unbounded across the lifetime of a long-running instance.
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

/**
 * Checks (and records) a request against a sliding-window rate limit.
 *
 * @param key Unique identifier for the caller + resource being limited
 * @param opts limit / windowMs configuration
 */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, windowMs } = opts;
  const now = Date.now();

  let state = store.get(key);
  if (!state) {
    // Basic eviction guard: if the map is getting large, drop the oldest-ish
    // entry. This is a cheap safety valve, not precise LRU.
    if (store.size >= MAX_TRACKED_KEYS) {
      const firstKey = store.keys().next().value;
      if (firstKey !== undefined) {
        store.delete(firstKey);
      }
    }
    state = { timestamps: [] };
    store.set(key, state);
  }

  const windowStart = now - windowMs;
  state.timestamps = state.timestamps.filter((t) => t > windowStart);

  if (state.timestamps.length >= limit) {
    const oldest = state.timestamps[0];
    const retryAfterMs = oldest + windowMs - now;
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  state.timestamps.push(now);
  return { ok: true, retryAfter: 0 };
}

/**
 * Builds a per-user rate limit key scoped to a specific route/action so
 * different endpoints don't share the same bucket.
 */
export function rateLimitKeyForUser(userId: string, scope: string): string {
  return `user:${userId}:${scope}`;
}
