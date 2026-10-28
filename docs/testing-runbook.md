# Human Alignment Testing Runbook

Journey tests run on the local Supabase stack. That is the Docker stack the automated journey already uses (`npm run test:e2e`, `tests/e2e/core-journey.spec.ts`): made-up accounts and a stubbed model. It costs nothing and does not write to the live database. The run proves the code. It does not prove the live project's settings. A hosted staging Supabase project is not set up, and one is used only if Jon approves the cost. Production is not the default place for journey runs.

## Real-model variant

`npm run test:e2e` stubs OpenRouter. The stub's first analysis returns one ownership conflict. Both partners resolve it with the same custom solution, the next analysis returns no conflicts, and the journey continues through both signatures on one snapshot and a multi-page PDF. CI runs that command on every pull request.

To run the same browser journey once against this local stack with the real model:

```bash
E2E_REAL_MODEL=1 npm run test:e2e
```

The app reads `OPEN_ROUTER_API_KEY` and falls back to `OPENROUTER_API_KEY`. Export the key in the environment for that command. The runner exits before Playwright starts when neither name is set. It does not load `tests/e2e/support/openrouter-stub.cjs`, and it does not read the key from a file. One run is the whole cost: question generation and the analysis calls for that alignment. Accounts are still made up on the local stack. The test prints `E2E_ALIGNMENT_ID` and `E2E_EVIDENCE`. Record the date, the git SHA, and that alignment id.

This runbook replaces `E2E_TEST_PLAN.md`. That plan described the November 2025 share-link flow, assumed a local Supabase instance, and stored sample account passwords. It is removed. Passwords, invite tokens, and other credentials stay in the operator handoff. Labeled test accounts come from that handoff.


## Cursor Cloud environment

Status: tested locally on Node 22.23.4; the Linux baseline and candidate installs passed (FLEET-273). The fresh prepared Build and browser check are tracked in that issue. The saved environment selects `.cursor/environment.json`; its Build runs `.cursor/install.sh`, which selects Node 22.23.4 and runs `npm ci`. It no longer writes injected credentials to `.env.local`. `start: true` is finite; the managed terminal runs `.cursor/dev.sh` with compile-only Supabase placeholders and empty mail and AI credentials, overriding any inherited values or dotenv file. This preview cannot run the signed-in journey. For that, use the isolated local stack described below. In every new Bash shell, `source .cursor/runtime.sh` before npm commands, because Cursor can place its Node shim first on PATH.

Read the current Fleet Handbook and issue. Before intervention, record Cursor environment-info (actual Build, config source/version) and `git rev-parse HEAD` separately; check the managed terminal and GET `/`, `/example`, and `/pricing`. Record whether relevant variables are set, never their values. Run the installer twice on disposable worker state, and `npm run lint`, `npm run type-check`, `npm test`, and `npm run build` (CI uses compile-only placeholders). Check the lockfile and git status. Never copy production service credentials into smoke tests.

Public smoke: with isolated or placeholder Supabase configuration, open `/`, follow the example and pricing links, and verify their headings. Do not submit forms or use real customer data. The signed-in journey needs the disposable local Supabase stack described in the end-to-end section. Test hot reload with a temporary local-only edit and restore it. Check unrelated browser origins remain rejected. Stop only manually started servers and remove temporary files. Record actual results and limitations in FLEET-273.

Rollback: revert the repo recipe commit and rebuild the same saved environment, or select a previously successful Build in Cursor. The pre-change environment is `bb11cff2-aca3-11f1-ba66-0e7d0216e441`, version `9e1cd435-acae-11f1-ba66-0e7d0216e441`; pre-change Build `bld-20261028-cc641225-9c41-450d-af69-67a5adac3218` used commit `6dd698a6d11855b0aa0d397396f8166bda7d6a3c`. Recheck current Builds before rollback.

## Status

On October 27, 2026 three completed agreements were exported from production (`https://www.alignthehumans.com`) and every page was checked. The 5-page "A fair guest and shared-space policy" (7 terms) and the 3-page overnight-guests agreement (1 long term) kept each term whole. Both had one fully blank page between the last term and the disclaimer. The 5-page file also left the "Detailed Terms" heading alone at the bottom of page 1. A 2-page single-short-term export had no blank page. Those two defects are fixed in the PDF exporter ([ATH-14](https://linear.app/contentionmedia/issue/ATH-14)). Retest from a completed agreement: Download Agreement, then open every page. There should be no blank page, no term sliced mid-line, and "Detailed Terms" on the same page as Term 1. Repeat with one long term that fills a page and with one short term.

The signed-in two-partner journey has not been re-run since the September 27, 2026 redesign ([ATH-32](https://linear.app/contentionmedia/issue/ATH-32)).

The July 11–12, 2026 sections below are historical evidence from before that redesign. They are not a current pass. No staging Supabase project is verified. How production deploys, how to compare applied migrations with `supabase/migrations`, and how to roll a deploy or a migration back are in `docs/deploy.md`. `supabase/config.toml` describes a local Supabase stack only; it names no hosted project. A recipe that says "isolated project" means that local Supabase stack (Docker, made-up accounts, stubbed model). Migrations, invite-row inserts, and forced failures in those recipes run on that local stack.

## Automated checks

`npm test` is the `test` script in `package.json`. It typechecks each group with `tsc`, then runs `node --test` on:

- `app/api/auth/email/hook.test.ts` — seven cases for the Supabase Auth Send Email hook (pull request #12): a current Standard Webhooks signature, missing headers, a wrong signature, a stale signature, a timestamp newer than the 5 minute tolerance, fail-closed in production when the hook secret is unset, and a plan for each auth email type the route handles
- `app/lib/partner-search.test.ts`
- `app/lib/rate-limit.test.ts`
- `app/lib/ops-alert.test.ts`
- `app/lib/ai-recovery.test.ts`
- `app/lib/api-error-message.test.ts`
- `app/lib/agreement-pdf.test.ts` — keeps "Detailed Terms" with Term 1, and drops only the full-page disclaimer spacer

These unit tests do not cover invite, join, answers, analysis, signatures, or the browser PDF rasterizer. `npm run lint`, `npm run type-check`, and `npm run build` are the other checks in `.github/workflows/ci.yml`. The signed-in core journey (invite, join, answer, analyze, resolve a conflict, analyze again, sign, PDF) runs as `npm run test:e2e` on a local Supabase stack with a stubbed model and made-up accounts. The stub returns one conflict, then a conflict-free analysis after both partners submit the same resolution. `.github/workflows/e2e.yml` runs that command on pull requests to `main` and on pushes to `main`. The real-model variant is `E2E_REAL_MODEL=1 npm run test:e2e`, described above. CI does not set that variable.

## Current journey

Status: the signed-in journey has not been re-run since the September 27, 2026 redesign ([ATH-32](https://linear.app/contentionmedia/issue/ATH-32)). The October 27, 2026 PDF page check is in the status section ([ATH-14](https://linear.app/contentionmedia/issue/ATH-14)). The steps below describe the routes as the code implements them today. They are the procedure for the next signed-in pass. They are not a record of a pass.

Role/account: two authenticated users. On production (`https://alignthehumans.com`), use the labeled comped creator and partner accounts from the operator handoff. A creator with no paid credit, no `pro` or `team` plan, and no future `comped_until` can activate one alignment. The second activation returns `402` with `error.code` `FREE_LIMIT_REACHED` before any AI request. Passwords stay in the operator handoff. A localhost run is separate from production evidence.

Opening `/alignment/[id]` routes by status:

- `draft` → `/alignment/[id]/clarity`
- `active`, and this user has not submitted → `/alignment/[id]/questions`
- `active`, and this user has submitted → `/alignment/[id]/waiting`
- `analyzing` → `/alignment/[id]/analysis`
- `resolving` → `/alignment/[id]/resolution` (that page sends a conflict-free round to the document)
- `complete` → `/alignment/[id]/document`

### 1. Create

1. Sign in and open `/alignment/new`.
2. Pick a template card (Partnership Terms, Bringing Someone In, Equity Split, Business Operations, Marketing Strategy, Roommate Agreement) or Custom.
3. Confirm one `alignments` row and its owner `alignment_participants` row are created together by `create_alignment_with_owner`, and the browser lands on `/alignment/[id]/clarity` while status is still `draft`. Creating the draft does not claim the free alignment.
4. On Clarity, fill the topic, who the creator is aligning with, and the desired result, then press Continue. That posts `/api/alignment/generate-questions`. For a draft, `claim_alignment_activation` runs before any model call. When the question template is stored, the alignment becomes `active` and the browser opens `/alignment/[id]/questions`. Questions come from the model, or from the curated fallback if generation fails validation.
5. A second draft's Continue, with no paid credit, `pro`/`team` plan, or future `comped_until`, opens the upgrade dialog titled "Your free creator alignment is in use". The button is "Request a pilot spot". Success toast: "Pilot spot requested. We’ll be in touch before anything is charged." The click inserts `upgrade_interest`. Billing is not live. The dashboard shows "1 of 1 free alignments used" only after `free_alignment_claimed_at` is set.
6. Typing or selecting a partner on Clarity supplies question context only. It does not insert a partner `alignment_participants` row.

### 2. Invite

1. On Clarity, before a partner participant exists, the creator sees "Waiting for Partner" and the share-link card. The same card is on `/alignment/[id]/waiting` while the creator is waiting and no partner has joined.
2. The link is not created on page load. Press Generate Link. `POST /api/alignment/[id]/generate-invite` returns `201` with `invite_url`. The visible toast is "Share link created!".
3. The URL is `{NEXT_PUBLIC_APP_URL}/join/{token}` (the route falls back to `http://localhost:3000` only when that env var is unset). The invite expires in 30 days, `max_uses` is 1, and the UI shows "Expires in N days". Copy shows "Link copied to clipboard!". Devices with `navigator.share` also show Share.
4. The database stores the SHA-256 hash, not the raw token. `GET /api/alignment/[id]/invite` rebuilds the URL from the stored ciphertext for the creator only.
5. Regenerate asks "Regenerate Share Link?" and warns that the old link stops working immediately. Confirming posts `/api/alignment/[id]/regenerate-invite` and toasts "New share link generated!".
6. The share-link button does not send email. Email is sent only when that POST body includes `partnerEmail`.

### 3. Join

1. Open `/join/[token]` while logged out. A valid invite shows "You're Invited to Join an Alignment", the alignment title, "Shared by {creator}", and the expiration line.
2. Sign in to Join goes to `/login?redirectTo=/join/{token}`. Create Account goes to `/signup?redirectTo=/join/{token}`. Both login and signup keep a safe `redirectTo` and return to the invite.
3. Join Alignment posts `/api/alignment/join` with `{ token }`. The route hashes the token and calls `redeem_alignment_invite`. Success returns `alignment_id` and the message "Successfully joined alignment", then the browser opens `/alignment/[id]`, which follows the status router. A repeat redemption returns "Already joined alignment".
4. A logged-in person who is already a participant is redirected by the join page to `/alignment/[id]` before the button is shown (`get_alignment_invite_preview` status `already_participant`).
5. Bad links render a card and "Go to Homepage", not a join button:
   - malformed token: "Invalid Invitation Link"
   - unknown token: "Invitation Not Found"
   - revoked: "Invitation Revoked"
   - expired: "Invitation Expired"
   - use limit reached: "Invitation Limit Reached"
   - alignment already complete: "Alignment Completed"
6. Join attempts are limited to 10 per hour per IP. The next attempt is `429` with "Too many join attempts. Please try again in an hour."

### 4. Answer

1. Each person opens `/alignment/[id]/questions` and answers independently. Submit Responses writes `submitted_at` and sends that person to `/alignment/[id]/waiting`.
2. A submitted questionnaire does not reopen. A direct visit to `/questions` goes to waiting, or to analysis, resolution, or the document if the alignment has already moved on.
3. The waiting page shows whether the partner has joined and whether they have submitted. Once two submitted responses exist for the round, it opens `/alignment/[id]/analysis` (on load, when alignment status changes, or on a poll about every 10 seconds).

### 5. Analyze

1. If the current round has no saved analysis and at least two submitted responses, `/analysis` shows the progress card and posts `/api/alignment/analyze` with `{ alignmentId, round }`.
2. That route moves `active` or `resolving` to `analyzing`, then to `resolving` when the analysis is stored. A `200` with an analysis refreshes the page into the report. If the progress card is still showing "Analysis complete", View Report reloads it.
3. The report's action is Resolve Conflicts (`/resolution`) when `conflicts` is non-empty, and Generate Final Document (`/document`) when it is empty.
4. Fewer than two submitted responses on `/analysis` redirects back to `/questions`.

### 6. Resolve, then analyze again

1. `/resolution` requires status `resolving`, a current-round analysis, and a partner participant. Each conflict can be an AI suggestion, the partner's position, the user's own position, or a custom solution.
2. Submit posts `/api/alignment/[id]/submit-resolution`. Resolution rows are the next response round (`current_round + 1`) and carry `metadata.resolution_submission`.
3. When only one person has submitted, the page stays on `/resolution`. When both have submitted and the round cap has not been hit, both go back to `/analysis` for the next round.
4. `MAX_RESOLUTION_ROUNDS` is 5. At the cap, the resolution page refreshes in place and does not start another analysis.
5. A later analysis with zero conflicts is the path into the document. `/resolution` itself redirects to `/document` when the current analysis has no conflicts.

### 7. Sign

1. `/alignment/[id]/document` loads only when the viewer is a participant, status is `resolving` or `complete`, the current round has an analysis, and that analysis has zero conflicts. Anything else redirects: remaining conflicts to `/resolution`, missing analysis to `/analysis`, `draft` to `/clarity`, `active` to `/waiting`, `analyzing` to `/analysis`.
2. The page shows a preview until the first signature freezes the snapshot. Both people sign that same 64-character hash. The checkbox reads "Confirm your digital signature as {name}. I have reviewed the agreement document and consent to sign these terms." Sign posts `/api/alignment/[id]/sign` with `{ round, reviewedSnapshotHash }`.
3. The first signature keeps status `resolving` (`allSigned` false). The second signature, on the identical hash, completes the alignment. A hash that does not match the snapshot on the server asks the signer to review the refreshed document.
4. Agreement dates and signature timestamps are formatted in UTC. Signature lines use `formatAgreementTimestamp` and end in "UTC". The summary date is the same string frozen into the document body.

### 8. PDF

1. Download Agreement is rendered only after both participants have signed (`allSigned`). It is not a server PDF route.
2. The button rasterizes `#alignment-document-export` in the browser with `html2pdf.js` 0.14.0 (letter, portrait, 0.5 inch margin, JPEG via html2canvas). The import is `html2pdf.js/src/index.js`. The published `dist/html2pdf.js` embeds jsPDF 4.0.0, which is the Producer string on production PDFs from before this fix, and that copy does not include the 4.2.1 patches for the ATH-28 advisories. The source entry uses the direct `jspdf` dependency 4.2.1. The filename is the alignment title slug plus `.pdf`.
3. Page breaks use `before: ['.document-disclaimer']` and avoid headings, table rows, `.term`, `.term-heading-keep`, `.signature-participant-row`, `.document-disclaimer`, `.document-footer`, and `.document-meta`. html2pdf inserts a full extra page when that forced break lands on a disclaimer already at the top of a page; the exporter removes that spacer. The "Detailed Terms" heading is grouped with the first term so it is not left at the bottom of a page. The file is an image, so text is not selectable.
4. Open every page. Terms must not be sliced mid-line. "Detailed Terms" must be on the same page as Term 1. There must be no blank page. The agreement date must match between the summary and the body. Both signature rows must be intact and show explicit UTC timestamps. The October 27, 2026 production check found the 5-page and 3-page exports above: terms were not split, each file had a blank page, and the 5-page file had the orphaned heading. This change fixes the blank page and the heading. Retest with Download Agreement on a multi-term agreement, a long single term, and a short term. A signed-in walk through invite, answers, analysis, and one live AI generation remains [ATH-32](https://linear.app/contentionmedia/issue/ATH-32).

What to record when that pass happens: alignment id, invite HTTP status (not the token), analysis rounds with score and conflict count, the snapshot hash both people signed, whether status stayed `resolving` after the first signature and became `complete` after the second, and the PDF page count plus any clipped line. Credentials and the raw invite token stay out of the notes.

## Historical evidence (July 11–12, 2026)

The sections below keep the July 11–12 lessons. Read them as what that run observed. The status lines say what is and is not still current.

## Deployed production journey and capture gate

Status: historical July 12, 2026 production run. The October 27, 2026 production PDF check, including the blank page and orphaned heading fixed after it, is in the status section ([ATH-14](https://linear.app/contentionmedia/issue/ATH-14)). The signed-in journey has not been re-run since the September 27, 2026 redesign ([ATH-32](https://linear.app/contentionmedia/issue/ATH-32)). The July "needs repair" pagination note is not the current status.

Purpose: Verify the deployed `alignthehumans.com` build through invite generation, multi-round analysis, report transition, agreement signatures, and PDF export before creating a separate clean demo-capture alignment.

Role/account: Use the labeled comped creator and partner test accounts from the operator handoff. Passwords stay in that handoff.

Safe actions:

- Create clearly labeled production test alignments through the visible UI.
- Generate and redeem an invite through the normal creator and partner interfaces.
- Run the paid AI steps for one end-to-end verification alignment and one final capture alignment.
- Preserve screenshots, browser recordings, and the completed verification alignment as evidence.

Scope:

- Evidence for this recipe is the deployed site. A localhost run is a separate check.
- Invite rows, journey rows, and statuses change through the visible creator and partner interfaces.
- The clean final capture is a new alignment. The recovery alignment and the verification alignment stay as evidence.
- Captures include the two test identities and their alignment content. Credentials and invite tokens stay out of captures.

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
- After pinning `isomorphic-dompurify@2.26.0`, the deployed document route passed. Both users signed frozen snapshot `3ca31c17fe4290f37bbc62f85551bb01f20b8884d6ac88131c70d48d5f9e479e`; the first signature kept status `resolving`, and the second changed it to `complete`.
- Production agreement dates matched (`July 12, 2026`) and both signature timestamps displayed `July 12, 2026 at 2:43 AM UTC`. The forced disclaimer break and signature rows rendered intact.
- The four-page deployed PDF still fails the visual gate on ordinary term content: page 1 is sliced through Term 1's value paragraph and page 2 begins with the clipped remainder. The capture alignment remains intentionally uncreated until longer document pagination avoids mid-line raster slicing.

## Recovery checkpoint: round 3 through signed agreement

Status: tested locally against the production database on 2026-07-11. Deployed production was exercised on July 12, 2026, in the section above. The October 27, 2026 production PDF check is in the status section ([ATH-14](https://linear.app/contentionmedia/issue/ATH-14)). The signed-in journey has not been re-run since the September 27, 2026 redesign ([ATH-32](https://linear.app/contentionmedia/issue/ATH-32)).

Purpose: Complete an existing two-person alignment from the round-3 analysis checkpoint through document generation, both signatures, completed status, and PDF export. This exercises the current branch through localhost against the production database; it does not prove that the deployed production application has the same fixes or configuration.

Role/account: Use the labeled creator and partner test accounts for alignment `287267e1-8c5e-4480-bcad-85c959f36d10`. Credentials come from the operator handoff. Passwords stay out of this runbook.

Safe actions:

- Use the normal login, analysis, document, signature, and PDF interfaces for this labeled test alignment.
- Capture screenshots containing only the two test identities and their alignment content.
- Retry an idempotent UI action only after recording the first failure and confirming that the prior request did not succeed.

Scope:

- Alignment rows, analyses, responses, signatures, and status change through the normal UI for this labeled test alignment.
- This checkpoint uses the existing alignment. It does not insert invite rows.
- A localhost result describes this branch against the production database. The July 12 section above is the deployed-application record.
- Local AI configuration clamps and credentials stay out of git commits.

Verification steps:

1. Confirm localhost serves the intended branch and record any uncommitted diagnostic diff before starting.
2. Log in through the visible form as the creator and open `/alignment/287267e1-8c5e-4480-bcad-85c959f36d10/analysis`.
3. Trigger or observe round-3 analysis. Record the HTTP/UI result and capture the resulting score, agreements, and remaining conflict count.
4. If conflicts remain, record the score, agreements, and conflict count, then continue in the resolution form. The next analysis runs after both people submit that round. Rows change through that workflow.
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

Status: historical July 11, 2026 recipe. Static checks had passed when this section was written; the database integration test was still pending. No staging project is verified. These steps describe the July three-tier gate. The live gate is the partnership pilot in "Current journey" above.

Purpose: Verify `20260711235125_account_entitlements.sql`, the one-free-alignment activation gate, upgrade-interest capture, and invite-only partner enrollment.

Role/account: Two disposable authenticated users on the local Supabase stack. No staging project is verified, and this repo has no `supabase/config.toml`. Use the first as creator and the second as invitee. This smoke test runs on that isolated project, with a test account and a throwaway alignment.

Safe actions:

- Create labeled draft alignments and early-access intent rows on the isolated project.
- Set test-only entitlement plans, credits, and comp dates with a service-role/admin session.
- Retry question generation on the same labeled draft to verify idempotency.

Scope:

- Entitlement, credit, comp-date, and activation-claim edits in this smoke test use the disposable test users on the isolated project.
- The migration applies on the isolated project.
- Concurrency and failure-path checks use a local model stub.

Verification steps:

1. Apply migrations through `20260711235125_account_entitlements.sql` on the isolated project and confirm every auth user has one `account_entitlements` row.
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

- Delete labeled test alignments and `upgrade_interest` rows on the isolated project.
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

Status: historical July 11, 2026 recipe. Static checks had passed when this section was written; the database integration test was still pending. No staging project is verified. Follow "Current journey" for the product path. This section is the July integrity recipe.

Purpose: Verify the journey integrity fixes introduced by `20260711234901_atomic_sign_completion.sql`.

Role/account: Two disposable authenticated users on the local Supabase stack. No staging project is verified, and this repo has no `supabase/config.toml`. Destructive setup for this recipe runs on that isolated project. Smoke tests use a test account and a throwaway alignment.

Safe actions:

- Create a labeled test alignment and disposable responses/signatures.
- Force API/database failures only on the isolated project.
- Delete the labeled test alignment after verification; cascading foreign keys remove its journey rows.

Scope:

- Submitted responses, signatures, and alignment statuses in this recipe belong to the labeled throwaway alignment on the isolated project.
- The migration applies on the isolated project.

Verification steps:

1. Apply migrations through `20260711234901_atomic_sign_completion.sql` on the isolated project and regenerate database types if the schema differs.
2. Run `npm run type-check && npm run lint && npm run build`.
3. Create an alignment from `/alignment/new`; confirm one `alignments` row and its owner `alignment_participants` row are created together.
4. Add the second user, submit the owner questionnaire, then open `/alignment/<id>/questions` directly. Confirm it redirects to waiting or the current later phase and does not reopen the form.
5. Attempt to update `answers` on the submitted questionnaire row. Confirm PostgreSQL rejects it with `Submitted questionnaire answers cannot be changed`.
6. Submit resolution choices through the normal route, including a retry on an already-submitted resolution row. Confirm the dedicated next-round response can still be updated and submitted.
7. Save an analysis while the alignment is `analyzing`, then call `POST /api/alignment/analyze` again. Confirm cached analysis repairs the status to `resolving` before returning `200`.
8. Force both `analyzing -> resolving` update attempts to fail on the isolated project. Confirm analyze returns `503` with `ANALYSIS_STATUS_TRANSITION_ERROR`, not a successful analysis response.
9. Force either template insert or alignment template attachment to fail. Confirm clarity shows a toast, remains on the clarity page, and the API returns a structured 500 error.
10. Sign as user one and confirm `allSigned=false` and status remains `resolving`. Sign the same snapshot as user two and confirm exactly one request reports `didComplete=true`, with status `complete`.
11. Create mismatched snapshot signatures on the isolated project and call `complete_alignment_if_all_signed`. Confirm status remains `resolving`.
12. Call the completion RPC as a non-participant and confirm access is denied.

Cleanup:

- Delete the labeled test alignment from the isolated project.
- Remove any temporary failure policies, triggers, or mocks used for steps 8–9.

Checkpoint seed data:

- Recommended fixture: two disposable users plus one `resolving` alignment with a conflict-free current-round analysis and frozen agreement snapshot.
- No durable fixture is checked in yet.

Known selector/flow lessons:

- Resolution submissions live at `responseRound = current analysis round + 1` and carry `metadata.resolution_submission = true`.
- The sign API requires the exact reviewed 64-character snapshot hash.
- The waiting page polls, so realtime is not part of this regression pass.
