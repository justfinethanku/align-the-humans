# ATH: restore Linear team lines removed by FLEET-98 (FLEET-207b)

## What Changed
- AGENTS.md: the Fleet section's team line is back to its original wording: `- Linear team: ATH. Work and status live in Linear.`

## Why
FLEET-207 asked every sweep owner to re-check its removals. The FLEET-98 pointer change dropped "Work and status live in Linear." from the team line. The Handbook still carries that rule (7a, which quotes Jon: "Linear is your biggest management thing... agents are always checking Linear for anything assigned to them"). Restoring the line changes no behaviour and keeps the original repo text.

## How
- Fresh clone under FLEET-207b; branch `jon/fleet-207-restore-removed-lines`.
- One line changed. Left out, with reasons: the `# CLAUDE.md` title (the file was renamed to AGENTS.md); the Fleet Handbook bullet (the same URL is already in the pointer block at the top).

## Issues Encountered
None.

## Dependencies
None.

## Testing
Docs-only change; no code touched, so no local test run. CI runs on the PR.

## Next Steps
None.
