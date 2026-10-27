/**
 * Pure helpers for partner search.
 *
 * The route may answer only an exact, case-insensitive email. Fragments
 * ("jo", "jo@") and display names are not queries. Matching is equality
 * after trimming and lowercasing, so a stored address that merely contains
 * the query is not a hit.
 */

const EXACT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Per-user budget for GET /api/partners/search. Shared store; see rate-limit.ts. */
export const PARTNER_SEARCH_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

export interface EmailCandidate {
  id: string;
  email?: string | null;
}

/**
 * Returns the lowercased email when `input` is a full email address, otherwise null.
 * The whole string must be the address: surrounding words do not count.
 */
export function normalizeExactEmail(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return null;
  if (!EXACT_EMAIL.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

/**
 * First other user whose email equals `normalizedEmail`.
 * `normalizedEmail` must already be the output of `normalizeExactEmail`.
 */
export function findExactEmailUserId(
  users: readonly EmailCandidate[],
  normalizedEmail: string,
  excludeUserId: string
): string | null {
  for (const user of users) {
    if (user.id === excludeUserId) continue;
    if (typeof user.email !== 'string') continue;
    if (user.email.toLowerCase() === normalizedEmail) return user.id;
  }
  return null;
}
