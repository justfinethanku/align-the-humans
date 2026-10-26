# ATH-29: Clarity page status redirects swallowed by try/catch

**Keywords:** [BUG] [NEXTJS] [REDIRECT] [CLARITY] [ROUTING]
**Session:** 2026-10-26, ~02:15–02:40 (linked agent session, ~25 min)
**Commit:** 67dbf05 (fix), merged via PR #15
**Linear:** ATH-29 (found by the code review of ATH-6, PR #14)

## What Changed

- `app/alignment/[id]/clarity/page.tsx`
  - Imports `unstable_rethrow` from `next/navigation`.
  - The outer `catch` calls `unstable_rethrow(error)` as its first line, so the framework's redirect signal propagates instead of being logged and turned into `redirect('/dashboard')`.

## Why

`redirect()` in Next works by throwing. The page's status switch (`active` → `/questions`, `analyzing` → `/analysis`, `resolving` → `/resolution`, `complete` → `/document`) runs inside a `try` whose `catch` redirected everyone to `/dashboard`. So opening the clarity page for an already-active alignment landed the user on the dashboard instead of the questions page. The bug predates ATH-6; it was only found during that review.

## How It Was Done

- Chose `unstable_rethrow` (Next 16.4.3 exports it from `next/navigation`) over moving the redirects out of the `try`. The one-line change keeps the page's existing error handling for real failures (auth, fetch) and its existing redirect targets.
- Checked the sibling redirect sites before settling on scope:
  - `analysis/page.tsx` and `document/page.tsx`: redirects sit outside their `try` blocks (document's `try` wraps only the data fetch, and its catch hands the error to a helper that redirects). No change needed.
  - `login/actions.ts` and `signup/actions.ts`: already rethrow on `NEXT_REDIRECT`. No change needed.
  - `auth/callback/route.ts`: uses `NextResponse.redirect`, which does not throw. No change needed.

## Issues Encountered

- `npm run build` with a symlinked `node_modules` fails in Turbopack ("Could not find the Next.js package"). Fixed by running a real `npm ci` in the worktree.
- The production build's prerender step needs Supabase env vars that are not in the worktree. Built with placeholder values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `INVITE_TOKEN_SECRET`. The placeholders are build-only and were not used at runtime.

## Dependencies

None added or changed.

## Testing Notes

- `npx tsc --noEmit`: exit 0.
- `npx eslint "app/alignment/[id]/clarity/page.tsx"`: exit 0.
- `npm run build` (placeholder env): compiled, TypeScript passed, `/alignment/[id]/clarity` built as a dynamic route.
- Not tested live: the signed-in check (sign in, open `/alignment/<active id>/clarity`, confirm it lands on `/questions`) was not run. The only active alignment in prod belongs to a test account whose login is not in the vault, and an unauthenticated request cannot show the difference (`requireAuth` throws, it does not redirect).
- Code review: `code-simplicity-reviewer` on the diff, verdict SHIP. Its one SHOULD (state the live-test status here) and one NIT (commit SHA) were applied.

## Next Steps

- None in scope. Among the `app/` files that call `redirect()` inside a `try`, the clarity page is the only one whose `catch` does not rethrow the redirect (login and signup rethrow `NEXT_REDIRECT`; analysis and document keep redirects outside the `try`).
- Possible follow-up (not done here): `login/actions.ts` and `signup/actions.ts` detect redirects by matching `error.message === 'NEXT_REDIRECT'`. `unstable_rethrow` would be the framework-supported check. Works today; left alone.

## Impact Assessment

- UX: users with an already-active alignment who open the clarity page now land on the questions page instead of the dashboard.
- No change for draft alignments, unauthenticated users, or non-participants.

## Lessons Learned

- Any `redirect()` inside a `try` needs `unstable_rethrow(error)` (or the redirect moved out). The bug only surfaces as a wrong landing page, so it is easy to miss in review.
