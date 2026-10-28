# ATH-46: Keep the December 5, 2025 codebase audit on main

**Keywords:** [DOCS] [AUDIT] [HISTORY] [ATH-46]
**Session:** 2026-10-28, about 07:35 UTC
**Commit:** recorded on the pull request

## What Changed
- Copied `docs/CODEBASE_AUDIT.md` from commit `a58d070` on `claude/codebase-audit-01UizBrDCgJ3ab4cqTa9awbG` onto current main.
- Added one line at the top: it is a dated snapshot from December 5, 2025, kept for history, and its findings have not been rechecked since.
- `README.md` documentation list points at the file.

## Why
The audit existed only on an unmerged branch that is one commit ahead of an older main. Copying the file keeps it without bringing that stale base along. The old branch is left in place.

## How It Was Done
`git checkout a58d070 -- docs/CODEBASE_AUDIT.md` from a fresh branch off current main, then the one-line note. The old branch was not merged.

## Issues Encountered
None.

## Dependencies
None.

## Testing Notes
Docs only. The copied body matches `a58d070` aside from the snapshot line. No code changed.

## Next Steps
Deleting `claude/codebase-audit-01UizBrDCgJ3ab4cqTa9awbG` is part of ATH-24 and still needs Jon's yes.

## Impact Assessment
The audit is in the repo's history on main. Readers are told the findings are unchecked since December 5, 2025.

## Lessons Learned
A one-commit branch off an old main is preserved by copying the file, not by merging the branch.
