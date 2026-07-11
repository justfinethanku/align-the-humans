# Human Alignment Testing Runbook

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
