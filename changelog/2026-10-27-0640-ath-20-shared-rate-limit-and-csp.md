# ATH-20: shared rate limits and an enforced content security policy

**Keywords:** [SECURITY] [RATE-LIMIT] [CSP] [SUPABASE] [ATH-20]
**Session:** 2026-10-27, about 06:16 UTC onward
**Commit:** branch `bruh/shared-rate-limit-csp-2777`

## What Changed

- `app/lib/rate-limit.ts` now calls `public.consume_rate_limit` in the existing Supabase project so every serverless instance shares one sliding window. Keys are SHA-256 hashed before they are stored. If the call throws, that process falls back to its own memory so a limiter outage does not take login or the auth email hook down.
- Login, signup, forgot-password, the AI routes, and partner search already called `checkRateLimit`. They now use the shared store without a new budget.
- New budgets: join 10/hour per IP; generate-invite and regenerate-invite 10/hour per user; invite GET 60/minute per user; sign 10/minute per user; submit-resolution 20/minute per user; alignment update 120/minute per user per alignment (clarity autosave); upgrade-interest 5/hour per user; auth email hook 8/hour per verified recipient and 30/minute per IP for bad signatures.
- `429` responses from `createErrorResponse` include `Retry-After`.
- `next.config.js` sends an enforced `Content-Security-Policy` (no longer Report-Only) with `report-uri` and `report-to` pointed at `POST /api/csp-report`. The policy allows self-hosted scripts, styles, and next/font files, Supabase HTTP and websocket, and the AI gateway and OpenRouter hosts. PDF export may start a blob worker.
- Migration `supabase/migrations/20261027062707_shared_rate_limit_store.sql` creates `rate_limit_hits` and `consume_rate_limit`. RLS is on, and only `service_role` can execute the function or touch the table.

## Why

ATH-20. The in-memory map reset on every serverless instance, and several routes had no limit. The report-only CSP blocked nothing and had nowhere to send reports. No paid rate-limit service. Postgres in the existing project is the shared store.

## How It Was Done

The SQL function takes an advisory transaction lock per key, drops hits outside the window, and inserts one row unless the count is already at the limit. The app calls it with the service role over PostgREST. `anon` and `authenticated` have no grant.

## Issues Encountered

Direct database host `db.<ref>.supabase.co` is IPv6-only from this environment and was unreachable. The us-east-2 pooler is reachable, but the service role key is not the database password, and the Supabase MCP cannot complete an interactive login here. Production apply is a separate step from the code change.

## Dependencies

None added.

## Testing Notes

- `npm test` covers a second in-memory instance exceeding a shared window, `checkRateLimit` blocking on that store, the Postgres client blocking when the function returns full, and the CSP header text.
- Local Postgres 16: with limit 2, the third `consume_rate_limit` call returned `ok=false, retry_after=60`. A different key still passed. `anon` could not execute the function or read the table.
- Page load under the enforced CSP is checked against the running app and the Vercel preview.

## Next Steps

Apply the migration to the production Supabase project `align the humans` before or with the merge, then confirm a real `consume_rate_limit` call blocks the extra hit.

## Impact Assessment

Auth, AI, search, invites, signing, resolution, updates, pilot requests, and the auth email hook share limits across instances once the migration is applied. The CSP blocks script, style, font, and connection sources outside the allowlist.

## Lessons Learned

A service-role RPC with RLS and revoked grants is enough of a shared limiter. Fail open to process memory only when the RPC throws, so a missing migration does not take the site down, and do not treat that fallback as the limit holding.
