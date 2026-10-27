# ATH-8: partner search answers only an exact email

**Keywords:** [SECURITY] [PARTNERS] [RATE-LIMIT] [EMAIL] [ATH-8]
**Session:** 2026-10-27, about 04:20-05:00 UTC
**Commit:** branch `bruh/ath-8-exact-email-partner-search-7aa3` (squash-merged to `main`)

## What Changed

- `app/api/partners/search/route.ts`: `GET /api/partners/search` no longer runs a display-name `ilike` or a substring email scan. A query returns a profile only when it is a full email address and that address matches exactly, case-insensitively. The caller is excluded. Profile reads stay on the RLS-bound server client.
- Fragments and names (`jo`, `jo@`, a display name) return `{ results: [] }` and do not call `auth.admin.listUsers`.
- Exact-email lookups are limited to 10 per minute per user via `checkRateLimit` / `rateLimitKeyForUser`. A 429 includes `Retry-After`.
- `app/lib/partner-search.ts`: `normalizeExactEmail` and `findExactEmailUserId`, plus the rate-limit budget.
- `app/alignment/[id]/clarity/ClarityForm.tsx`: the search box calls the route only once the input is a full email, and the placeholder says so. A non-OK response shows the API error message.
- `app/lib/partner-search.test.ts` and `package.json` `test` script: node:test coverage for the matcher, the budget, and a source check that the route does not substring-match.

## Why

ATH-8. On current `main` (after PR #17 / ATH-30) the email path still used `email.toLowerCase().includes(searchTerm)`, and display names still used `ilike '%query%'`. Any signed-in user could confirm visible accounts from a fragment such as `jo@`. There was no rate limit. The decision for this issue is option (b): keep the search, exact email only, rate limit with the existing in-memory helper. Widening who can be found is ATH-33 and was left alone. No migration.

## How It Was Done

Matching is trim + lowercase + equality. The installed supabase-js admin client has no exact-email filter, so an exact address still pages `listUsers` up to 1,000 users and stops at the first equal address. The matched id is then loaded with the session client, so RLS still hides profiles the caller cannot already see. That is the same visibility as PR #17. A shared-store limiter remains ATH-20.

## Issues Encountered

None during the change. The 1,000-user page cap remains for the exact lookup because removing it would mean a migration or a new email column. That was not required for the substring fix.

## Dependencies

None added or removed.

## Testing Notes

`npm test` includes the new partner-search tests. Also `npm run lint`, `npm run type-check`, and `npm run build`.

## Next Steps

- ATH-20: replace the in-memory limiter with a shared store.
- ATH-33: decide whether an exact email of someone you do not already share an alignment with should return their profile. This change does not.

## Impact Assessment

Signed-in users can no longer enumerate display names or confirm accounts from an email fragment. Exact email of a person the caller can already see still returns `{ id, display_name }`. Signed-out callers still get 401.

## Lessons Learned

The email substring survived the ATH-30 RLS fix because the admin `listUsers` scan was unchanged; the profile read only hid people the caller could not already see.
