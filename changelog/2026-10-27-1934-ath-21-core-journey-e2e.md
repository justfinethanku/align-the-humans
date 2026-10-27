# ATH-21: Automated test for the core two-partner journey

**Keywords:** [TESTING] [E2E] [PLAYWRIGHT] [SUPABASE] [CI] [ATH-21]
**Session:** 2026-10-27, evening UTC
**Linear:** ATH-21

## What Changed

- `tests/e2e/core-journey.spec.ts` drives one journey in Chromium: a creator starts from a template, generates an invite link, a partner joins and both answer, analysis runs with no conflicts, both sign the same snapshot, the creator downloads a valid signed PDF, and the database shows `complete` with two signatures.
- `tests/e2e/run.mjs` (`npm run test:e2e`) starts a local Supabase stack, resets it, and runs Playwright with the local keys. Accounts and data are made up and created per run.
- `tests/e2e/support/openrouter-stub.cjs` is preloaded with `NODE_OPTIONS` and answers OpenRouter calls with canned output. The app code is unchanged.
- `playwright.config.ts` builds and starts the app on port 3100.
- `.github/workflows/e2e.yml` runs the journey on pull requests and pushes to `main`. Its job name `e2e` is the status check.
- `supabase/config.toml` moves this project's local ports to 553xx.
- `supabase/migrations/20261027120000_repair_fresh_db_columns.sql` adds `alignments.clarity_draft` and `alignment_invitations.token_ciphertext` if they are missing.
- `supabase/migrations/20251110052038_realtime_policies.sql` wraps its statements in a guard for `insufficient_privilege`.
- `next.config.js` adds the configured Supabase origin and its `ws` variant to `connect-src`.
- `.gitignore` un-ignores `supabase/config.toml`.

## Why

The core journey had no automated test, so breaking it went unnoticed until a person ran it by hand.

## How It Was Done

- Playwright was chosen because the repo has no e2e runner. It runs against a local Supabase stack so no shared environment is touched.
- A fresh database did not have two columns the app writes. `20250120120000` runs before `alignments` exists, so its `alter table if exists` does nothing. The new migration adds both columns idempotently. It is a no-op on production.
- The Content-Security-Policy `connect-src` did not include the local Supabase origin, so the browser blocked template creation. The fix lists the configured origin only, so production is unchanged.
- The clarity form's partner and outcome fields sit in closed accordions, and the test opens them before filling. The Generate Link control exists only on the clarity page before Continue, so the test creates the link there.

## Issues Encountered

- The local `postgres` role cannot alter `realtime.messages`, so the first `supabase start` failed. The realtime statements are guarded. Hosted behavior should be unchanged, but confirm on the next `supabase db push`.
- Port 54322 was in use by another local stack. This project now uses 553xx and the other stack was left running.
- A stale dev server on port 3100 could serve old code. `reuseExistingServer` is on outside CI, so confirm no server is running before a local run.

## Dependencies

- Added devDependency `@playwright/test` (^1). Chromium is installed with `npx playwright install --with-deps chromium`.
- Added the `test:e2e` npm script. The local runner needs Docker for the Supabase CLI stack.
- `RESEND_API_KEY` and `OPS_ALERT_EMAIL` are set empty for test runs, so no real email is sent.

## Testing Notes

- `npm run test:e2e` passes locally: 1 test, about 10 seconds.
- `npm run lint`: 0 errors, 6 warnings already present in other files.
- `npm run type-check` and `npm test` pass.

## Not Verified

- The real model path. The OpenRouter stub returns canned output.
- The invite sign-up path for a new partner. Only the logged-in partner join is covered.
- Resolution and multi-round conflicts. The stub returns zero conflicts.
- Realtime RLS policies on a local stack, which the guard skips.
- The PDF's visual layout. The test checks for a `%PDF` header and a size above 5 KB.
- The GitHub Actions run until it executes on a pull request.

## Next Steps

- Add a sign-up-through-invite journey and a conflict-resolution journey.
- Replace the model stub with a recorded fixture or a cheap real call on a schedule.
