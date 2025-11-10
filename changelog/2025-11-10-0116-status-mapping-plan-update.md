# 2025-11-10-0116 - status mapping + plan sync

**Keywords:** [PLANNING] [SUPABASE] [STATUS] [DOCS]
**Session:** Late night (~20 min)
**Commit:** N/A

## What Changed
- Documented the UI badge → Supabase status mapping in `context/supabase_cli.md`, including a recommended `alignment_status_view` SQL snippet and guidance on keeping RLS policies aligned.
- Updated `plan_a.md` to reference the derived `ui_status` logic in the questions flow and expanded the status badge section to cover both canonical and derived states.

## Why
- The UI needed richer status labels (waiting for partner, awaiting signatures, stalled) without bloating the DB enum. A documented mapping keeps frontend, API, and Supabase in lockstep.
- The plan must reflect how status transitions really work so implementation doesn’t diverge from the data layer.

## How It Was Done
- Added a Markdown table + SQL view example to `context/supabase_cli.md` showing how to compute `ui_status` from participant/response/signature counts and `updated_at` thresholds.
- Adjusted `plan_a.md` to lean on that mapping in the questionnaire flow and to list all badge colors keyed by either canonical status or derived `ui_status` values.

## Issues Encountered
- None; straightforward doc edits.

## Dependencies
- No new packages or env vars.

## Testing Notes
- N/A (documentation update only).

## Next Steps
- Scaffold the Next.js app using these status rules and ensure API routes query the `alignment_status_view`.

## Impact Assessment
- Everyone now shares the same mental model for statuses, reducing risk of discrepancies between Supabase data and UI presentation.

## Lessons Learned
- Writing the mapping down once (with SQL) is faster than chasing ad-hoc interpretations later.
