# ATH-11: GitHub Actions CI on pull requests and main

**Keywords:** [CI] [GITHUB-ACTIONS] [LINT] [TYPECHECK] [TEST] [BUILD]
**Session:** 2026-10-27, ~04:21 UTC
**Commit:** 415a9899333916a4f30f2ac6edd28a848fc30d0f
**Linear:** ATH-11

## What Changed

- Added `.github/workflows/ci.yml`.
- One job, named `ci`, runs on every pull request to `main` and on every push to `main`.
- Steps: `npm ci` (Node 22, npm cache), `npm run lint`, `npm run type-check`, `npm test`, `npm run build`.
- The build step sets obvious placeholder values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `INVITE_TOKEN_SECRET`. They are compile-only stand-ins, not credentials.

## Why

Nothing checked a pull request before merge. Merging deploys to production, and a green pull request only meant Vercel had built it. Lint, types, the auth-hook unit tests, and a production build now have to pass in GitHub Actions.

## How It Was Done

- The repo has no `.nvmrc` and no `engines` field. `@types/node` is 22 and Next 16 supports Node 20.9+, so the workflow uses Node 22.
- `actions/setup-node` caches npm from `package-lock.json`.
- The job name is `ci`. That string is the status-check context for branch protection.
- Placeholder env vars are scoped to the build step. A prior production build (ATH-29) needed the same four names present or prerender threw.

## Issues Encountered

- Recorded in the pull request after the GitHub Actions run and the attempt to require the `ci` check on `main`.

## Dependencies

None added or changed.

## Testing Notes

- Local `npm run lint`, `npm run type-check`, `npm test`, and `npm run build` with the same placeholder env and without `.env.local`.
- GitHub Actions on the pull request, then the push to `main` after merge.
- Vercel production deployment for the merge commit.

## Next Steps

- Require the `ci` status check on `main` (branch protection or a ruleset). The job name is the context.
- ATH-21 (journey regression) stays out of scope.

## Impact Assessment

- Pull requests to `main` gain a CI signal separate from the Vercel build.
- The production build in CI does not talk to the real Supabase project.

## Lessons Learned

- `next build` can fail with missing public env vars even when those values are only read inside request handlers, because prerender still calls the client factories.
