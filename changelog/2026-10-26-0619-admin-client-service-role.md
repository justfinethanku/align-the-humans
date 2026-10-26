# ATH-30: createAdminClient runs as the service role

**Keywords:** [SECURITY] [SUPABASE] [RLS] [ADMIN] [ATH-30]
**Session:** 2026-10-26, about 06:00-06:40 ET (Haiku worker)
**Commit:** see the merge commit for PR "ATH-30" on `main`

## What Changed

- `app/lib/supabase-server.ts`: `createAdminClient()` is now a synchronous `createClient` from `@supabase/supabase-js`, built with the service role key and `auth: { persistSession: false, autoRefreshToken: false }`. It no longer reads the request cookies. The `cookies` import stays for `createServerClient()`.
- Dropped `await` from the 7 admin call sites: `app/lib/prompts.ts` (2), `app/admin/prompts/page.tsx`, `app/admin/prompts/[slug]/page.tsx`, `app/admin/prompts/[slug]/actions.ts`, `app/api/alignment/analyze/route.ts`, `app/api/alignment/[id]/sign/route.ts`.
- `app/api/partners/search/route.ts`: profile reads (name search and the email-match profile lookup) now go through the RLS-bound `supabase` client. The admin client is only used for the `auth.admin.listUsers` email scan. The header comment is rewritten, because it described an own-row-only RLS that no longer matches the migrations.
- `CLAUDE.md`: the "Supabase Client Pattern" bullet no longer says `createAdminClient` is async.

## Why

`createAdminClient()` passed the request cookies to `@supabase/ssr`. When a user session cookie existed, supabase-js sent the user's access token on `.from()` requests, so those queries ran as the user under RLS. The admin client was not bypassing RLS.

## How It Was Verified

- Reproduced the mechanism in Node with `@supabase/ssr` and a fake session cookie (`verify/auth-header-check.mjs`, outside the repo). The old construction sent `Authorization: Bearer <user access token>` on `GET /rest/v1/prompts`. The new one sends the service role key.
- `auth.admin.*` requests carried the service role key in both constructions (`verify/auth-admin-check.cjs`). Email lookups in the analyze and sign routes were already using the service role, so their behavior does not change.
- Visibility audit of every caller (table below). Only the partner search profile reads would have changed what a real user sees, so they were kept RLS-bound.
- `npm run type-check` (tsc --noEmit): clean. `eslint` on changed files: clean. `npm test` (auth email hook, 7 tests): pass. `npm run build` with placeholder env vars: compiled and TypeScript finished; the prerender needs real Supabase env vars, which are not in the repo.

| Caller | Tables touched via admin | Visibility after fix |
|---|---|---|
| `partners/search` | profiles (now RLS-bound), auth users (admin, unchanged) | Same as before: profiles RLS (own row + shared-alignment partners) |
| `analyze`, `[id]/sign` | none; `auth.admin.getUserById` only | Unchanged (auth admin already used the service key) |
| `lib/prompts.ts` `getPrompt`/`getAllPrompts` | prompts | Same rows: `prompts_read_all` already lets every authenticated user read prompt rows, and the loaders filter to `is_active`; all callers are authenticated routes |
| `admin/prompts/*` pages and actions | prompts, prompt_versions, admin_audit_log | Same for admins. App-level `is_admin` gate runs before the client is created (`admin/layout.tsx`, `requireAdminUser`) |

## Issues Encountered

- A symlinked `node_modules` broke Turbopack's workspace-root resolution; a real `npm ci` in the worktree fixed it.
- `next build` prerender needs `NEXT_PUBLIC_SUPABASE_*` env vars; the repo has no `.env.local`, so the verification build used placeholder values.

## Dependencies

None added or removed. `@supabase/supabase-js` is already a direct dependency.

## Testing Notes

Not run against a live Supabase project (no credentials in the worktree). The RLS claims above come from reading the migrations and from the header-level request checks, not from a live query.

## Next Steps

- **Decision for Jon (partner search):** partner search finds only people who already share an alignment with you. The admin client was written to widen that (its comment says "service role"). Widening it would show every user's display name to every signed-in user, by name or by email substring. Left unchanged here. If you want wider search, that needs a deliberate policy and probably its own migration.
- Stale docs: `plan_a.md` line 111 still describes `createAdminClient()` as used "sparingly". Not touched.

## Impact Assessment

Admin-only code paths now use a client without cookies. Behavior for real users is unchanged. Admin writes to `prompts`, `prompt_versions` and `admin_audit_log` no longer depend on RLS policies for their success, so an admin's write can no longer fail on RLS, and the app-level gate is now the only check.

## Lessons Learned

Passing a server-side client the request's cookies is a silent change of identity. Every admin helper should be built from the service key alone.
