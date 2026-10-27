# ATH-13: replace the stale E2E plan and correct the testing runbook

**Keywords:** [DOCS] [TESTING] [SECURITY] [ATH-13]
**Session:** 2026-10-27, about 04:21-04:40 UTC
**Commit:** see the squash merge for the ATH-13 pull request

## What Changed

- Removed `E2E_TEST_PLAN.md`. It described the November 2025 share-link flow, assumed a local Supabase instance, and stored a sample password.
- Rewrote the top of `docs/testing-runbook.md` so it describes the journey the routes implement today: create, invite, join, answer, analyze, resolve, sign, and the browser PDF. Status lines now say the long-document PDF check and the signed-in journey have not been re-run since the September 27, 2026 redesign (ATH-14, ATH-32). The runbook documents `npm test` (seven `node --test` cases for the Auth email hook, pull request #12).
- Kept the July 11–12 lesson notes and marked them historical. Replaced "needs repair" and "deployed-production verification remains pending". Recipes no longer say a staging project exists. There is no `supabase/config.toml`, and no staging project is verified.
- Redacted sample passwords from five November 2025 changelog files. Git history was not rewritten.
- Pointed `README.md` and `AGENTS.md` at the runbook and `npm test`.

## Why

Anyone following `E2E_TEST_PLAN.md` tested a product that no longer exists, and the file put a sample password in a public repo. ATH-2 depends on these docs for acceptance evidence. The runbook's status still said the production journey needed repair and that deployed verification was pending, which was true in July and is the wrong claim after the September redesign.

## How It Was Done

Read the alignment, join, invite, analyze, resolution, sign, and document routes, plus the entitlement claim and the PDF exporter, and wrote the journey from that code. Did not run the signed-in journey (out of scope; ATH-14 and ATH-32).

## Issues Encountered

None in the doc edit. The July monetization recipe still describes a three-tier upgrade dialog. The live UI is the single partnership pilot, so that recipe is labeled historical and the current dialog copy is in "Current journey".

## Dependencies

None.

## Testing Notes

`npm run lint`, `npm run type-check`, `npm test`, and `npm run build` are the checks for this change. The signed-in production journey and the long-document PDF were not run.

## Next Steps

ATH-14 and ATH-32: re-run the long-document PDF and one signed-in AI generation on the current production build, then record the result in this runbook.

## Impact Assessment

Testers and later agents follow the current routes instead of the November 2025 plan. Sample passwords are gone from the working tree.

## Lessons Learned

A status line written the day a gate failed becomes a false current status once the product is redesigned, even when the lesson notes under it are still worth keeping.
