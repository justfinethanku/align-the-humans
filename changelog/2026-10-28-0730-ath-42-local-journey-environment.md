# ATH-42: Journey tests run on the local Supabase stack

**Keywords:** [TESTING] [SUPABASE] [DOCS] [ATH-42]
**Session:** 2026-10-28, about 07:30 UTC
**Commit:** recorded on the pull request

## What Changed
- `docs/testing-runbook.md` opens with the agreed place for journey tests: the local Docker Supabase stack that `npm run test:e2e` and `tests/e2e/core-journey.spec.ts` already use, with made-up accounts and a stubbed model.
- The recipe intro no longer says an isolated project is one an operator names. That phrase now means the local stack. The two July role lines that repeated the old phrase point at the same stack.

## Why
The signed-in two-partner journey had no agreed test environment. A hosted project would need Jon to approve the cost and is not set up. Production is not the default place for journey runs.

## How It Was Done
Docs only. The note states what the local run proves (the code) and what it does not (the live project's settings).

## Issues Encountered
None.

## Dependencies
None.

## Testing Notes
Docs only. No code or tests changed. `ci` and `e2e` still run on the pull request.

## Next Steps
ATH-2 can use this environment for the missing two-partner run with real analysis. A hosted staging project waits on Jon approving the cost.

## Impact Assessment
An operator reading the runbook no longer has to invent a project name before running a recipe.

## Lessons Learned
The automated journey had already chosen the environment. The manual recipes had not caught up.
