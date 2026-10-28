# Deploying Align the Humans

Checked on 2026-10-27 from this repository, the GitHub deployments and commit statuses on `justfinethanku/align-the-humans`, and the Vercel project linked to that repo. A fact that was not checked is marked **UNKNOWN**.

This is the app deploy. It does not apply SQL. Database migrations are a separate step, below.

## Where production runs

Vercel project `align-the-humans` (`prj_fZFGPqFUDFLxb9bQ7SASHTNBtSkl`) on team `jonathan-edwards-projects` (`team_NS912Og3TMSpAO9Hi9rH8Ptn`, Pro). The project is linked to GitHub `justfinethanku/align-the-humans`. Framework Next.js, Node 22.x, function region `iad1`.

The repository has no `vercel.json` and no `.vercel` directory. Build and deploy settings that live only in the Vercel dashboard were not returned by the project read used here. **UNKNOWN:** the dashboard build command, install command, and ignored-build setting.

Production domains on the current production deployment:

- `https://alignthehumans.com` responded `307` to `https://www.alignthehumans.com/`
- `https://www.alignthehumans.com/` responded `200`
- `align-the-humans.vercel.app`
- `align-the-humans-jonathan-edwards-projects.vercel.app`
- `align-the-humans-git-main-jonathan-edwards-projects.vercel.app`

Vercel Authentication (`ssoProtection`) is enabled for `all_except_custom_domains`. Password protection is off. A preview URL for pull request 25, `align-the-humans-calwb4d1o-jonathan-edwards-projects.vercel.app`, responded `302` to `https://vercel.com/sso-api`. The custom domains above are outside that protection.

The production deployment current at the end of this check is `dpl_9f12wziVeVRYkFpHCGn3F6LrgDCC`. It is `source: git`, target `production`, state `READY`, commit `7d006c4a4b72b6316a83b5f0060de39f358c7689` on `main` (pull request 26), and its aliases include `alignthehumans.com` and `www.alignthehumans.com`. GitHub recorded that Production deployment at 2026-10-27T20:32:23Z, created by `vercel[bot]`. The previous production deployment, `dpl_H2vDz8mA3Yj3Lze1Ee1rdQKeULV5`, is also `source: git` and `READY`, on commit `002922b9d18cf64a1558844742b68fb20de33323`.

## Pushes to `main` deploy to production

The Vercel GitHub integration publishes `main`. `.github/workflows/ci.yml` lints, type-checks, runs `npm test`, and runs `next build`. That workflow does not call the Vercel CLI. On commit `002922b9d18cf64a1558844742b68fb20de33323` (pull request 25, merged 2026-10-27T19:36:55Z):

- GitHub Actions run `40570711077` was created at 19:36:58Z and completed at 19:37:51Z.
- The Production deployment was created at 19:37:24Z and the Vercel commit status was already "Deployment has completed".

The production deploy finished while `ci` was still running. A push to `main` is enough. `ci` is a separate check.

The first Vercel read listed 38 production deployments. All 38 were state `READY`, `githubCommitRef` `main`, and `isRollbackCandidate: true`. Asking for production deployments older than the oldest of those 38 returned none. Pull request 26 then added `dpl_9f12wziVeVRYkFpHCGn3F6LrgDCC`, also `READY` and a rollback candidate.

GitHub first-parent history on `main` compared with GitHub Production deployments:

- From `2db7a4087302e4d3ff57e553fa3a8938b626393b` (2026-02-17 20:10 ET, "Remove ~2,000 lines of dead code and fix UI flickering") through `7d006c4a4b72b6316a83b5f0060de39f358c7689` (2026-10-27, pull request 26), all 29 first-parent commits have a Production deployment. That span includes the merge commits of pull requests 2 through 10 and 12 through 26, and five commits that landed on `main` without a pull-request merge commit (`343836ce2597`, `539a3b8e7b4c`, `6d5907600e26`, `b857b812185b`, `2db7a4087302`).
- Two earlier gaps have no GitHub deployment record. `ac74aaba389a` (2025-11-24 21:56 ET) has none; the commit two minutes later does. Fifteen commits from `6899de07d727` through `5b1b17f0cce1` (2026-02-17 18:21–19:03 ET) have none. Vercel returns no deployment for `5b1b17f0cce1`. **UNKNOWN:** why those 16 commits have no deployment record.

Pull requests 13 through 26 each have a Production deployment on the merge commit. So do pull requests 2 through 10 and 12. Pull request 11 is open and has no merge commit. There is no pull request 1.

**UNKNOWN:** classic branch protection on `main` returned 403 to this token, so required status checks could not be read. The rulesets list was empty. Whether GitHub refuses a merge when `ci` or `Vercel` fails was not tested. A failed `ci` run was not observed, so whether a failing `ci` run can stop a Vercel deploy is **UNKNOWN**. The one successful push above deployed before `ci` finished.

## Pull requests get previews

Every pull request in the repository has a Preview deployment on its head commit, created by `vercel[bot]`, and a successful commit status context `Vercel` ("Deployment has completed"). That is pull requests 2 through 25. Pull request 11 is still open; its head `3bbbf91ab70914a873f532d6fb4e458569fa5a8c` has a Preview deployment created 2026-10-09.

The preview for pull request 25 head `f9cc58aaccfdc37829e6c4ec90578e0cdf5f11e1` is deployment `dpl_6g1Tj6H9sE7qAd3DXV98RsHz8k1p`, branch `bruh/handbook-only-agent-rules-8e0e`, target `null` (preview), state `READY`, `isRollbackCandidate: false`.

Pull request 25's checks were `Vercel`, `Vercel Preview Comments`, and `ci`. The other pull requests were checked through the commit status API, which showed the `Vercel` status. **UNKNOWN:** whether every older pull request also has a check named `Vercel Preview Comments`.

**UNKNOWN:** a branch push that never becomes a pull request was not tested on its own. Previews above are the head of each pull request.

## Database

The only Supabase project ref named in the repo is `qvzfcezbuzmvglgiolmh` (`.env.example`, `app/lib/README.md`, and the November 2025 setup notes). This environment's `NEXT_PUBLIC_SUPABASE_URL` host is `qvzfcezbuzmvglgiolmh.supabase.co`. `supabase/config.toml` configures the local stack only and names no second project ref. No staging Supabase project is configured here. Creating one is out of scope.

Vercel has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` on the development, preview, and production targets. Those values were not read. **UNKNOWN:** whether preview and production point at the same Supabase project.

`supabase/migrations` holds the SQL files. There are 25. Filenames sort by their timestamp prefix. `20250120120000_add_clarity_draft_and_invite_usage.sql` sorts ahead of the `20251110…` files. A search of those files found no down-migration section.

Nothing in `.github/workflows/ci.yml` applies SQL. A Vercel production deploy publishes the Next.js build. It does not run `supabase db push`.

As of Oct 27, 2026, all 25 files are applied on production (`qvzfcezbuzmvglgiolmh`) and each history version matches its filename. Twelve had been applied through the Supabase MCP, which records an apply-time version instead of the filename prefix. `supabase migration list --linked` then showed those files as not applied, and `supabase db push` would have run them again. Several use plain `create table`, so a re-run would fail partway. The repo files were renamed to the recorded versions, contents unchanged, rather than rewriting production's history. The new prefixes stay in the same order, including before `20261027120000_repair_fresh_db_columns.sql`, which is recorded under its own filename version. See [ATH-45](https://linear.app/contentionmedia/issue/ATH-45).

Apply a future migration with the CLI so the recorded version stays the filename prefix:

```bash
supabase link --project-ref qvzfcezbuzmvglgiolmh
supabase db push --linked --dry-run
supabase db push --linked
```

`--dry-run` prints the migrations that would be applied. `db push` writes each filename prefix into `supabase_migrations.schema_migrations` and skips versions already there.

If the SQL is applied through the Supabase MCP, that write uses an apply-time version. Right afterward, record the filename prefix and remove the apply-time row. Neither command runs SQL:

```bash
supabase migration repair <filename-version> --status applied --linked
supabase migration repair <apply-time-version> --status reverted --linked
```

`<filename-version>` is the 14-digit prefix of the file. Then `supabase migration list --linked` should show the file as applied and no extra remote version.

## Check applied migrations against the repo

The check is a timestamp diff. Local versions are the 14-digit prefixes of `supabase/migrations/*.sql`. Remote versions are `supabase_migrations.schema_migrations`. The CLI compares timestamps only.

```bash
supabase link --project-ref qvzfcezbuzmvglgiolmh
supabase migration list --linked
```

Or, with a database password this repo does not store:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```

A local prefix missing from the remote column is not recorded as applied. A remote version with no local file is on the database and not in the repo.

As of Oct 27, 2026, production's history matches these filenames. A read of `supabase_migrations.schema_migrations` at 10:20 PM ET that day showed every migration's effect present, with twelve rows under apply-time versions because the Supabase MCP stamps the time of the apply. `20261027120000_repair_fresh_db_columns` was recorded afterward under its filename version. The twelve files were renamed to the versions from that read, so the history table was left unchanged. This repository change does not write to production.

The Data API rejects schema `supabase_migrations` (`PGRST106`), so this check needs the database password or the Supabase CLI, not the service-role key. A service-role `GET` of `public.rate_limit_hits?select=id&limit=0` against `qvzfcezbuzmvglgiolmh` returned `200` and `[]` on 2026-10-27. That table is created by `20261027072516_shared_rate_limit_store.sql`.

## Roll back a deploy

Instant Rollback points the production domains at an earlier production deployment. This session did not execute one. The steps and the side effect below are from Vercel's Instant Rollback documentation, fetched 2026-10-27. The team is Pro, and on Pro a deployment that was previously aliased to a production domain is eligible. The production deployments read above are rollback candidates. Preview deployments are not.

From the project overview, use Instant Rollback, choose the deployment, confirm the domains, and confirm. From the Deployments list, filter to `main`, open the row menu, and choose Instant Rollback.

After a rollback, Vercel turns off automatic assignment of production domains. Further pushes to `main` still build, and they do not replace the rolled-back deployment until auto-assignment is turned back on. Restore it by promoting a deployment: the dashboard Undo Rollback button, or `vercel promote <deployment-id-or-url>`.

Rollback restores the previous build. Vercel does not roll environment variables forward, and it does not revert the database. A bad migration is still there after the app is rolled back.

## Roll back a migration

Write a new file in `supabase/migrations` that reverses the change, then apply it with `supabase db push --linked` after `supabase link`. If it is applied through the Supabase MCP, run `supabase migration repair <filename-version> --status applied --linked` right afterward and revert the apply-time version, as in Database above. Confirm with `supabase migration list --linked`.

`supabase migration repair <version> --status reverted` deletes the history row. `--status applied` inserts one. Neither runs inverse SQL. Use repair only to fix the history table after the schema is already in the intended state.

`supabase migration down --linked` is documented as resetting applied migrations on the linked project. These files contain no down SQL, and that command was not run. **UNKNOWN:** what `supabase migration down --linked` would do to `qvzfcezbuzmvglgiolmh`. Do not use it as the rollback.

## UNKNOWN

- Which tool applied the thirteen migrations whose history versions already matched their filenames on Oct 27, 2026. The other twelve were applied through the Supabase MCP. `rate_limit_hits` is one of those twelve (`20261027072516_shared_rate_limit_store.sql`).
- Whether the Vercel preview and production Supabase env vars are the same project.
- The dashboard build, install, and ignored-build settings.
- Why 16 older `main` commits have no deployment record.
- Whether GitHub required checks can block a merge, and whether a failing `ci` run can stop a Vercel deploy.
- Whether a branch with no pull request gets a preview.
- What `supabase migration down --linked` would do to this project.
