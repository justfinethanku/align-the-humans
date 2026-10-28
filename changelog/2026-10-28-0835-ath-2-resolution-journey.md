# 2026-10-28-0835 - ATH-2 resolution journey

**Keywords:** [TESTING] [E2E] [RESOLUTION] [OPENROUTER] [ATH-2]
**Session:** 2026-10-28 morning
**Commit:** `171e20a` and the docs commit that records the run

## What Changed

- The Playwright journey now resolves one stubbed conflict, runs a second analysis with no conflicts, then signs and downloads a multi-page PDF.
- `E2E_REAL_MODEL=1` runs that same journey against OpenRouter. The key stays in the environment (`OPEN_ROUTER_API_KEY`, fallback `OPENROUTER_API_KEY`). CI does not set the flag.
- `docs/testing-runbook.md` and `AGENTS.md` describe the resolution step and the real-model command.

## Why

ATH-21's automated journey stubbed an analysis with no conflicts, so resolution never ran. ATH-2 needs that step on every pull request, and a record of one real-model run when a key is available.

## How It Was Done

The OpenRouter stub returns one ownership conflict until the request contains the custom resolution text both partners submit. The next reply is conflict-free and includes eight agreement terms so the exported PDF is more than one page. The real-model flag skips the stub and forwards the environment key without writing it to a file.

## Issues Encountered

The first stub run clicked "View Report", and that click waited for a load event the analysis page does not settle. The test now reloads with `domcontentloaded` only when that card is still up.

Question generation on the real run returned choice questions without options. The existing fallback served the curated template. Analysis still ran on `z-ai/glm-5.2`.

## Dependencies

None added.

## Testing Notes

Stub journey passed locally: alignment `87b9aeeb-23c5-4894-9c1f-176616461544`, round 1 score 54 with 1 conflict, round 2 score 96 with 0 conflicts, 5-page PDF, status `complete`.

Real-model journey, one run, October 28, 2026, commit `171e20a`, alignment `39d2aa61-2e66-4600-aed4-79f28657b502`. Model `z-ai/glm-5.2`. Rounds: 15/4 conflicts, 85/2 conflicts, 88/0 conflicts. Both signatures on `9d1678074c5e7cc9a232ec6feb0cadff67a67951df7ec3b19884e116faad3483`. PDF 3 pages. Status `complete`.

## Next Steps

Comment on ATH-2 with the pull request, the squash SHA, and this alignment id.

## Impact Assessment

CI now fails if conflict resolution, the second analysis, or the multi-page PDF breaks. The default command still does not call a model.

## Lessons Learned

A retry of the same analysis prompt must keep returning the conflict. Keying the second reply off the resolution text does that. A call counter would not.
