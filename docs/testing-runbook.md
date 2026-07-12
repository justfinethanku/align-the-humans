# Human Alignment Testing Runbook

## Deployed production journey and capture gate

Status: needs repair (production invite and round-2 analysis passed; deployed document route returns 500)

Purpose: Verify the deployed `alignthehumans.com` build through invite generation, multi-round analysis, report transition, agreement signatures, and PDF export before creating a separate clean demo-capture alignment.

Role/account: Use the labeled comped creator and partner test accounts from the operator handoff. Never record their passwords here.

Safe actions:

- Create clearly labeled production test alignments through the visible UI.
- Generate and redeem an invite through the normal creator and partner interfaces.
- Run the paid AI steps required for one explicitly authorized end-to-end verification alignment and one final capture alignment.
- Preserve screenshots, browser recordings, and the completed verification alignment as evidence.

Unsafe actions:

- Do not use localhost as evidence for this recipe.
- Do not mint invite rows, edit journey rows, or repair statuses directly.
- Do not reuse the recovery alignment or verification alignment as the clean final capture source.
- Do not expose credentials or invite tokens in captures.

Verification steps:

1. Confirm `/pricing` and the deployed application load from `https://alignthehumans.com`.
2. Create a new labeled verification alignment as the creator.
3. Generate the invite through the visible UI, redeem it as the partner, and confirm both participants are enrolled.
4. Submit materially different independent answers, run initial analysis, and resolve at least one conflict.
5. Confirm a round-2-or-later analysis completes on production and automatically swaps the progress card for the fresh report.
6. Reach a conflict-free report, review the frozen document, and sign the identical snapshot as both users.
7. Download the deployed PDF, render every page, and confirm clean pagination, consistent agreement dates, and explicit UTC signature timestamps.
8. Only after steps 1-7 pass, create a separate fresh alignment and record the final clips in the locked capture-plan order.

Cleanup:

- Preserve completed labeled production alignments unless Jon requests deletion.
- Keep final capture footage separate from verification artifacts.

Checkpoint seed data:

- Existing completed recovery alignment `287267e1-8c5e-4480-bcad-85c959f36d10` remains evidence only.
- New production verification and capture alignment IDs must be recorded after creation.

Known selector/flow lessons:

- Production verification alignment: `6167f229-c180-43a2-b3f0-753129a95372`.
- Visible invite generation returned `201`, the generated URL persisted in the UI, and the partner enrollment succeeded through invite redemption.
- The deployed custom questionnaire generated eight questions and both production users submitted through the visible form.
- Round 1 analysis returned `200`, score `12`, and seven conflicts. After both users submitted matching resolutions, round 2 returned `200`, score `95`, and zero conflicts.
- Both analysis progress views swapped automatically to the fresh report in under 0.9 seconds; the `View Report` fallback did not appear.
- The deployed document gate failed before signatures: authenticated `GET /alignment/6167f229-c180-43a2-b3f0-753129a95372/document` returned `500`.
- Vercel production logs report `ERR_REQUIRE_ESM`: `jsdom` requires ESM-only `parse5/dist/index.js` through `isomorphic-dompurify`. The installed chain is `isomorphic-dompurify@2.31.0 -> jsdom@27.1.0 -> parse5@8.0.0`. Resolve this production runtime incompatibility before signature/PDF verification or final capture.

## Recovery checkpoint: round 3 through signed agreement

Status: tested locally against the production database on 2026-07-11; deployed-production verification remains pending

Purpose: Complete an existing two-person alignment from the round-3 analysis checkpoint through document generation, both signatures, completed status, and PDF export. This exercises the current branch through localhost against the production database; it does not prove that the deployed production application has the same fixes or configuration.

Role/account: Use the labeled creator and partner test accounts for alignment `287267e1-8c5e-4480-bcad-85c959f36d10`. Retrieve credentials from the operator handoff; never record passwords in this runbook.

Safe actions:

- Use the normal login, analysis, document, signature, and PDF interfaces for this labeled test alignment.
- Capture screenshots containing only the two test identities and their alignment content.
- Retry an idempotent UI action only after recording the first failure and confirming that the prior request did not succeed.

Unsafe actions:

- Do not edit alignment rows, analyses, responses, signatures, or status directly.
- Do not create or hand-mint invite rows during this checkpoint.
- Do not treat localhost success as verification of the deployed production application.
- Do not commit local AI configuration clamps or credentials.

Verification steps:

1. Confirm localhost serves the intended branch and record any uncommitted diagnostic diff before starting.
2. Log in through the visible form as the creator and open `/alignment/287267e1-8c5e-4480-bcad-85c959f36d10/analysis`.
3. Trigger or observe round-3 analysis. Record the HTTP/UI result and capture the resulting score, agreements, and remaining conflict count.
4. If conflicts remain, stop and report the product state; do not bypass the resolution workflow or mutate rows directly.
5. Open the generated agreement through the normal UI. Confirm the document renders and record its reviewed snapshot hash if the UI exposes it.
6. Sign as the creator. Confirm the application records the signature but does not mark the alignment complete while the partner signature is missing.
7. Log in through the visible form as the partner, open the same agreement, and sign the identical frozen snapshot.
8. Confirm the alignment becomes complete and both signatures appear on the completed agreement.
9. Export the PDF through the visible UI and verify that the downloaded file opens, contains the agreement content, and shows both signatures.

Cleanup:

- Preserve the completed labeled alignment as a checkpoint unless Jon asks for deletion.
- Remove local screenshots only after final demo assets have been selected and copied to their durable destination.

Checkpoint seed data:

- Production-backed test alignment `287267e1-8c5e-4480-bcad-85c959f36d10`, expected to begin at `status=resolving`, `current_round=3`, with both round-3 resolution submissions present and no round-3 analysis yet.

Known selector/flow lessons:

- The password visibility button also matches a broad `/password/i` label query. Use the exact textbox role/name for the password field.
- The round-3 analysis produced one remaining conflict at 62/100. Both users then submitted the same explicit custom compromise through the normal resolution form; round 4 completed at 95/100 with zero conflicts.
- After the analyze API returns `200`, the progress client can remain on an `Analysis complete` card until a fresh navigation. Reload the analysis route before asserting the full report.
- The document begins as a preview. The first signature freezes snapshot hash `7c6824170c7e975c743ed56b8630f65fce086ae52ee7e87e6e7461bf23497090`; the partner saw and signed the identical frozen hash.
- The first signature returned `allSigned=false` and kept the alignment `resolving`. The second returned `allSigned=true` and changed it to `complete`.
- PDF export downloaded a valid two-page letter PDF containing both signatures. Visual QA failed because the page break clips the disclaimer between pages 1 and 2. The agreement body displays July 12 while the summary and signature timestamps display July 11.
- The exported PDF is image-based; `pdftotext` produced no extractable agreement text.
- Follow-up export review on 2026-07-11 used the completed checkpoint through the updated `html2pdf.js` options. UTC date rendering was consistent for this fixture (`July 12, 2026`; both signatures at `12:43 AM UTC`), but the disclaimer remained clipped across pages 1 and 2. The new page-break configuration therefore did not clear the PDF visual gate.
- The exporter rule references `.signature-block`, but the rendered signature rows use `.signature-participant-row`; use the real selector when testing signature pagination.
- Round-2 follow-up verification on 2026-07-11 confirmed the summary and body both display `July 12, 2026`, and both signature timestamps display `July 12, 2026 at 12:43 AM UTC`. PDF pagination still failed: `.document-footer` was absent in the live DOM and the disclaimer remained clipped across pages.
- The agreement is sanitized twice. Adding `footer` only to `DocumentContent` is insufficient because `sanitizeAgreementDocumentHtml()` strips it before snapshot storage unless `AGREEMENT_DOCUMENT_ALLOWED_TAGS` in `app/lib/agreement-document.ts` also includes `footer`. Existing frozen snapshots have already lost the wrapper, so a compatible forced break should target the surviving `.document-disclaimer` element directly.
- Round-3 follow-up verification on 2026-07-11 passed against the existing legacy frozen snapshot. Forcing a break before `.document-disclaimer` moved the complete disclaimer to the top of page 2, kept both signature rows intact, and preserved the consistent UTC dates. This clears the local PDF visual gate; repeat on the deployed production build before final demo capture.

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
