# Monetization Gate and Participant Enrollment

**Keywords:** [MONETIZATION] [ENTITLEMENTS] [RLS] [PRICING] [INVITES]
**Session:** 2026-07-11 evening
**Commit:** Pending Claude review; working-tree changes intentionally left uncommitted.

## What Changed

- Added account entitlements, an activation-claim audit, transactional claim RPC, and upgrade-interest capture in `20260711140000_account_entitlements.sql`.
- Gated a creator's first draft activation before question-generation AI work and return a structured `FREE_LIMIT_REACHED` 402 response when no access remains.
- Added a three-tier early-access dialog, upgrade-interest API, public pricing page, and claimed-free usage line on the dashboard.
- Tightened participant inserts to creator-owned owner rows and removed selected-partner pre-enrollment from Clarity.
- Updated generated database types and the repo testing runbook.

## Why

Each account gets one complete creator alignment free, while invited partners participate without consuming access. Draft creation remains free, and the gate runs only when a creator first generates questions. Partner enrollment now requires explicit invite redemption.

## How It Was Done

The security-definer claim function locks the caller's entitlement row, validates draft ownership, records successful claims for retry safety, and selects plan, comp, free, or paid-credit access in one database transaction. Client UI reacts to the route's structured error code and records early-access intent through an authenticated RLS-protected route.

## Issues Encountered

- The sandbox cannot access the local Docker socket, so the new migration could not be applied to a local Supabase instance during this run.
- The sandbox also blocks listening on local port 3000, so a post-build HTTP smoke test could not start the Next.js server.

## Dependencies

None.

## Testing Notes

- `npm run type-check` passed.
- `npm run lint` passed with no warnings or errors.
- `npm run build` passed. It logged the existing offline AI Gateway model-discovery warning and stale browser-data notices.
- `git diff --check` passed, and the protected `20260711120000`/`20260711130000` migrations are unchanged.
- Database integration remains pending migration review/application in local or staging.

## Next Steps

- Have Claude review and commit the working-tree changes.
- Apply the migration in local/staging and run the two-account monetization/enrollment recipe in `docs/testing-runbook.md`.
- Keep the migration out of production until that review and integration pass is complete.

## Impact Assessment

The product can measure paid-plan interest and prevent a second unpaid creator activation without charging invited participants or blocking draft exploration. Direct partner pre-enrollment is no longer an authenticated-client capability.

## Lessons Learned

Activation and credit consumption must share one row lock and one durable claim ledger. Participant selection and participant enrollment are separate actions; only invite redemption establishes membership.
