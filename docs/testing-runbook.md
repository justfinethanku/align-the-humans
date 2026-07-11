# Human Alignment Testing Runbook

## Monetization activation gate and invite-only enrollment

Status: starter (static verification passed; database integration test pending migration review/application)

Purpose: Verify `20260711140000_account_entitlements.sql`, the one-free-alignment activation gate, upgrade-interest capture, and invite-only partner enrollment.

Role/account: Two disposable authenticated users in a local or staging Supabase project. Use the first as creator and the second as invitee.

Safe actions:

- Create labeled draft alignments and early-access intent rows in local/staging.
- Set test-only entitlement plans, credits, and comp dates with a service-role/admin session.
- Retry question generation on the same labeled draft to verify idempotency.

Unsafe actions:

- Do not change real users' entitlements, credits, comp dates, or activation claims.
- Do not apply the migration to production as part of this smoke test.
- Do not call paid AI generation repeatedly; use a local model stub when testing concurrency or failure paths.

Verification steps:

1. Apply migrations through `20260711140000_account_entitlements.sql` in local/staging and confirm every auth user has one `account_entitlements` row.
2. Create a new auth user and confirm `handle_new_user()` creates both `profiles` and `account_entitlements` rows.
3. As the creator, create several drafts from `/alignment/new`. Confirm no entitlement is claimed and every dashboard Start button still opens a new draft.
4. Generate questions for one draft. Confirm it becomes `active`, `free_alignment_claimed_at` and `free_alignment_id` are set, and one `alignment_activation_claims` row has `claim_source='free'`.
5. Retry activation for that same draft before its status update (use a local failure stub after the RPC). Confirm the retry returns allowed and does not add another claim or consume a credit.
6. Activate a second draft with no paid access. Confirm the API returns `402` with `error.code='FREE_LIMIT_REACHED'` before an AI request is made, and Clarity opens the three-tier upgrade dialog.
7. Click one early-access CTA in the dialog and on `/pricing`. Confirm each authenticated click inserts the selected tier and context into `upgrade_interest` and shows `You're on the early-access list`.
8. Give the creator one paid credit, retry the second draft, and confirm exactly one credit is consumed. Repeat with `plan='pro'`, `plan='team'`, and a future `comped_until`; confirm access is allowed without consuming the free claim or paid credits.
9. On the dashboard, confirm `1 of 1 free alignments used` appears only for a claimed entitlement.
10. Select the second user in Clarity and generate questions. Confirm no partner `alignment_participants` row is inserted. Redeem the invite as the second user and confirm the invite RPC creates the partner row.
11. Attempt a direct authenticated insert for another user's partner row. Confirm `participants_insert_creator` rejects it; confirm creator owner-row creation and invite redemption still succeed.

Cleanup:

- Delete labeled test alignments and `upgrade_interest` rows in local/staging.
- Delete disposable users or restore test entitlement values with service-role access.
- Remove local AI/failure stubs.

Checkpoint seed data:

- Recommended fixture: one unclaimed free creator plus a second disposable invitee.
- For credit/plan branches, reset the creator entitlement between cases with service-role access.

Known selector/flow lessons:

- The entitlement is claimed at the first question-generation request, not draft creation.
- The upgrade dialog is driven by the structured `FREE_LIMIT_REACHED` code, not message text.
- Selecting a known partner supplies question context only; enrollment occurs during invite redemption.

## Journey integrity: submit, analyze, resolve, sign, and create

Status: starter (static verification passed; database integration test pending migration review/application)

Purpose: Verify the journey integrity fixes introduced by `20260711130000_atomic_sign_completion.sql`.

Role/account: Two disposable authenticated users in a local or staging Supabase project. Do not run destructive setup against production.

Safe actions:

- Create a labeled test alignment and disposable responses/signatures.
- Force API/database failures only in a local or isolated staging project.
- Delete the labeled test alignment after verification; cascading foreign keys remove its journey rows.

Unsafe actions:

- Do not edit real submitted responses, signatures, or alignment statuses.
- Do not apply the migration to production as part of a smoke test.

Verification steps:

1. Apply migrations through `20260711130000_atomic_sign_completion.sql` to local/staging and regenerate database types if the schema differs.
2. Run `npm run type-check && npm run lint && npm run build`.
3. Create an alignment from `/alignment/new`; confirm one `alignments` row and its owner `alignment_participants` row are created together.
4. Add the second user, submit the owner questionnaire, then open `/alignment/<id>/questions` directly. Confirm it redirects to waiting or the current later phase and does not reopen the form.
5. Attempt to update `answers` on the submitted questionnaire row. Confirm PostgreSQL rejects it with `Submitted questionnaire answers cannot be changed`.
6. Submit resolution choices through the normal route, including a retry on an already-submitted resolution row. Confirm the dedicated next-round response can still be updated and submitted.
7. Save an analysis while the alignment is `analyzing`, then call `POST /api/alignment/analyze` again. Confirm cached analysis repairs the status to `resolving` before returning `200`.
8. Force both `analyzing -> resolving` update attempts to fail in local/staging. Confirm analyze returns `503` with `ANALYSIS_STATUS_TRANSITION_ERROR`, not a successful analysis response.
9. Force either template insert or alignment template attachment to fail. Confirm clarity shows a toast, remains on the clarity page, and the API returns a structured 500 error.
10. Sign as user one and confirm `allSigned=false` and status remains `resolving`. Sign the same snapshot as user two and confirm exactly one request reports `didComplete=true`, with status `complete`.
11. Create mismatched snapshot signatures in local/staging and call `complete_alignment_if_all_signed`. Confirm status remains `resolving`.
12. Call the completion RPC as a non-participant and confirm access is denied.

Cleanup:

- Delete the labeled test alignment from local/staging.
- Remove any temporary failure policies, triggers, or mocks used for steps 8–9.

Checkpoint seed data:

- Recommended fixture: two disposable users plus one `resolving` alignment with a conflict-free current-round analysis and frozen agreement snapshot.
- No durable fixture is checked in yet.

Known selector/flow lessons:

- Resolution submissions live at `responseRound = current analysis round + 1` and carry `metadata.resolution_submission = true`.
- The sign API requires the exact reviewed 64-character snapshot hash.
- The waiting page polls, so realtime is not part of this regression pass.
