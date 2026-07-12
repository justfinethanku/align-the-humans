# Journey Integrity Fixes

**Keywords:** [JOURNEY] [DATABASE] [SIGNATURES] [ANALYSIS] [QUESTIONNAIRE]
**Session:** 2026-07-11 evening
**Commit:** Not recorded; the managed workspace permits source edits but blocks `.git/index.lock` creation.

## What Changed

- Added atomic, RLS-independent signature completion and atomic alignment creation RPCs.
- Added a submitted-questionnaire immutability trigger while preserving resolution-row updates.
- Routed submitted users away from direct questionnaire access.
- Made analysis status transition retries and cached-analysis repair authoritative before success.
- Made question template persistence/attachment failures return errors surfaced by a clarity-page toast.
- Added typed database helpers and RPC definitions.
- Added a focused local/staging journey verification recipe.

## Why

The journey could complete from an RLS-filtered participant set, reopen submitted answers, return a completed analysis while status remained `analyzing`, silently continue when generated questions were not attached, and leave an orphan alignment if owner-participant creation failed.

## How It Was Done

The database now owns multi-row integrity decisions through fixed-search-path `SECURITY DEFINER` functions and a response trigger. Route handlers use typed helpers and structured errors; clients only navigate after durable persistence succeeds.

## Issues Encountered

- The managed sandbox blocks Git index writes, so requested logical commits could not be recorded.
- Local Supabase schema lint/integration execution was unavailable because the sandbox blocks Docker socket access.

## Dependencies

None.

## Testing Notes

- `npm run type-check` passed.
- `npm run lint` passed with no warnings or errors.
- `npm run build` passed. It logged the existing offline AI Gateway discovery warning and stale browser-data notices.
- `git diff --check` passed.
- Database integration checks remain pending migration review/application in local or staging.

## Next Steps

- Review and apply the migration in local/staging.
- Run the two-account recipe in `docs/testing-runbook.md`.
- Record logical commits from an environment with Git metadata write access.

## Impact Assessment

Completion, creation, and submitted-response integrity no longer depend on separate client-side writes or RLS-filtered counts. Recoverable persistence failures remain visible to users and retryable by the journey.

## Lessons Learned

Multi-row journey transitions belong in database transactions. Cached AI output is not a successful workflow result until the corresponding phase transition is confirmed.
