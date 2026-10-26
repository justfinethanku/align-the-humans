# Use after() for completion and analysis emails (ATH-31)

**Keywords:** [BUG] [NEXTJS] [EMAIL] [SERVERLESS] [AFTER]
**Session:** 2026-10-26, ~03:00–03:45 EDT (Haiku 5.5, fleet ticket run)
**Branch:** `jon/ath-31-use-after-for-fire-and-forget-emails-in-sign-and-analyze`
**Commit:** squash-merged to `main` via PR (see `git log` for ATH-31)

## What Changed
- `app/api/alignment/[id]/sign/route.ts`: `sendCompletionEmails` now calls `after(async () => {...})` instead of an unawaited async IIFE. `after` is added to the existing `next/server` import.
- `app/api/alignment/analyze/route.ts`: the "Agreement analysis complete" email block now runs under `after(async () => {...})` in place of the IIFE. Same import change, and the comment now reads "Send analysis complete emails once the response is sent".
- Bodies are unchanged. Only the wrappers and one comment moved.

## Why
The emails were started from a bare `(async () => {...})()` after the response had already been returned. On Vercel's serverless runtime there is no guarantee that work continues once the response is sent, so the "Agreement signed" and analysis emails could be dropped. Found in code review of the ATH-6 Next 16 upgrade; it predates that upgrade.

## How It Was Done
- `after()` from `next/server` (stable since Next 15; this repo is on 16.4.3). It registers work to run after the response within the same request scope.
- The sign route's IIFE sits in a helper, `sendCompletionEmails`, which the POST handler calls before returning. `after()` works there because the call still happens inside the request.
- Each callback keeps its own try/catch, so an email failure cannot surface as a request error.

## Issues Encountered
- Turbopack cannot build with a symlinked `node_modules` (`Could not find the Next.js package`). The worktree uses a real `npm ci` install instead.
- The prerender step needs the Supabase public env vars. No `.env.local` exists locally; production keys live in Vercel. The build check used placeholder values passed inline. The real deploy builds with the actual keys.
- `AGENTS.md` does not exist in this repo; `CLAUDE.md` and `README.md` were the guidance.

## Dependencies
None added or changed.

## Testing Notes
- `npx tsc --noEmit`: exit 0.
- `npx eslint` on both changed files: exit 0.
- `npm test` (auth email hook suite): 7 pass, 0 fail.
- `npm run build` with placeholder env vars: compiled; all `/api/alignment/*` routes including `sign` and `analyze` emitted.
- Code-simplicity review: no correctness findings. Changelog and a one-line comment fix applied. Larger refactors (shared participant-contact helper, batched profile reads) deliberately not done in this ticket.
- Not tested: a live signing end to end (needs real partner accounts), so the email arriving on prod is not yet confirmed. See the ATH-31 report.

## Next Steps
- Stale comment at `app/api/alignment/[id]/generate-invite/route.ts:126` calls the invite email "fire-and-forget", but that send is awaited. Not touched here (not next to this change); a one-line follow-up.
- Optional: a shared `getParticipantContacts` helper in `db-helpers.ts` would remove the duplicated participant/profile/email lookup in both routes.

## Impact Assessment
Completion and analysis emails now run under Next's post-response work guarantee. No change to request latency or response bodies. The behaviour change is only that emails are no longer at risk of being dropped.

## Lessons Learned
When a handler starts background work, use `after()` in Next 15+ rather than an unawaited promise. It is a one-line change per site.
