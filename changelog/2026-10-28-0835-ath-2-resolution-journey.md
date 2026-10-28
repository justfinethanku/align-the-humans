# 2026-10-28-0835 - ATH-2 resolution journey

**Keywords:** [TESTING] [E2E] [RESOLUTION] [OPENROUTER] [ATH-2]
**Session:** 2026-10-28 morning
**Commit:** recorded after the commit lands

## What Changed

- The Playwright journey now resolves one stubbed conflict, runs a second analysis with no conflicts, then signs and downloads a multi-page PDF.
- `E2E_REAL_MODEL=1` runs that same journey against OpenRouter. The key stays in the environment (`OPEN_ROUTER_API_KEY`, fallback `OPENROUTER_API_KEY`). CI does not set the flag.
- `docs/testing-runbook.md` and `AGENTS.md` describe the resolution step and the real-model command.

## Why

ATH-21's automated journey stubbed an analysis with no conflicts, so resolution never ran. ATH-2 needs that step on every pull request, and a record of one real-model run when a key is available.

## How It Was Done

The OpenRouter stub returns one ownership conflict until the request contains the custom resolution text both partners submit. The next reply is conflict-free and includes eight agreement terms so the exported PDF is more than one page. The real-model flag skips the stub and forwards the environment key without writing it to a file.

## Issues Encountered

Filled in after the local run.

## Dependencies

None added.

## Testing Notes

Local stub run and, if the environment has a key, one real-model run. Results are added after those runs.

## Next Steps

Record the real-model date, SHA, and alignment id on ATH-2 when that run finishes.

## Impact Assessment

CI now fails if conflict resolution, the second analysis, or the multi-page PDF breaks. The default command still does not call a model.

## Lessons Learned

A retry of the same analysis prompt must keep returning the conflict. Keying the second reply off the resolution text does that. A call counter would not.
