# ATH-40: AGENTS.md ship order

**Keywords:** [DOCS] [AGENTS] [CI] [E2E] [VERCEL] [ATH-40]
**Session:** 2026-10-28, about 00:26 UTC
**Commit:** see the merge commit for the ATH-40 pull request on `main`
**Linear:** ATH-40

## What Changed

- `AGENTS.md` now opens the working guide with a Ship section: `npm ci`, lint, type-check, `npm test`, `npm run test:e2e`, build, local `npm run dev`, the pull request checks (`ci`, `e2e`, and the Vercel preview), and how a merge to `main` deploys on Vercel.
- The Fleet Handbook pointer at the top is unchanged.
- `CLAUDE.md` points at that Ship section. `README.md` and `docs/testing-runbook.md` name the same `npm test` files as `package.json`.

## Why

Workers look for `AGENTS.md` first. The file had the code map and a short script list, and it did not say how a change is tested, reviewed, merged, or deployed.

## How It Was Done

Each command was taken from `package.json` scripts, `.github/workflows/ci.yml`, and `.github/workflows/e2e.yml`. The unit-test file list is the files the `test` script passes to `node --test`. `npm run test:e2e` is `node tests/e2e/run.mjs`, which Playwright runs as `tests/e2e/core-journey.spec.ts` on port 3100. Deploy and merge facts are the checked statements in `docs/deploy.md`, including the unknowns it already records. No secret values were copied. `main` gained the e2e suite in ATH-21 while this branch was open, so the Ship section was rewritten against that suite before merge.

## Issues Encountered

`docs/testing-runbook.md` and `README.md` still described `npm test` as only the seven auth-hook cases. The script also runs partner search, rate limit, ops alerts, AI reply recovery, and API error messages. Those two sentences were updated so the pointers in `AGENTS.md` stay true.

## Dependencies

None.

## Testing

Docs-only. The command list was checked against `package.json`, `.github/workflows/ci.yml`, `README.md`, and `docs/deploy.md`. CI on the pull request runs lint, type-check, tests, and build.

## Next Steps

None for ATH-40. Whether GitHub branch protection requires `ci` is still the unknown recorded in `docs/deploy.md`.

## Impact Assessment

A coding agent can follow one section for install, tests, the pull request, and the production deploy, and can follow `CLAUDE.md`, `README.md`, and `docs/deploy.md` for the rest.
