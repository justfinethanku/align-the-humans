# ATH-45: Migration filenames match production history

**Keywords:** [DATABASE] [MIGRATION] [SUPABASE] [ATH-45]
**Session:** 2026-10-28, about 02:30 UTC
**Commit:** `08f5f58`

## What Changed
- Renamed 12 files in `supabase/migrations` to the versions production already recorded. SQL contents are unchanged (git similarity 100%).
- `docs/deploy.md` records that as of Oct 27, 2026 all 25 files are applied on production and the history matches the filenames, why twelve versions differed, and how to apply future migrations so the recorded version stays the filename prefix.
- Updated filename references in `AGENTS.md`, `CLAUDE.md`, and `docs/testing-runbook.md`.

## Why
Production (`qvzfcezbuzmvglgiolmh`) had the effect of every migration, but twelve history rows used apply-time versions because those files were applied through the Supabase MCP. `supabase db push` would have tried to run them again, and several use plain `create table`.

## How It Was Done
`git mv` only. The new prefixes were checked against the old sequence: same suffix order, strictly increasing, unique, and still before `20261027120000_repair_fresh_db_columns`. Production was not written to.

Older session notes and the July 2026 audit briefs still name the files as they were when those notes were written. A comment in `20260702044116_lock_down_profiles_is_admin.sql` still mentions `20260701120000`; that file's contents were left unchanged.

## Issues Encountered
None. The rename does not require a database password or a production write.

## Dependencies
None.

## Testing Notes
Order check: 25 versions, suffix order preserved, strictly increasing. The `e2e` job applies the renamed files on a fresh local Supabase.

## Next Steps
Merge after `ci`, `e2e`, and the Vercel preview are green. Future applies should use `supabase db push`, or `supabase migration repair <filename-version> --status applied` right after an MCP apply (and revert the apply-time row).

## Impact Assessment
`supabase migration list --linked` can match the repo. No schema change.

## Lessons Learned
An MCP apply stamps the clock, not the filename. Repair the history to the filename prefix immediately, or the next `db push` treats the file as pending.
