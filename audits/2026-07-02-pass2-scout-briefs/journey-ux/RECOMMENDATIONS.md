# journey-ux scout

## Current state

1. Homepage renders a fixed marketing header, hero CTA to `/signup`, a how-it-works anchor, problem/use-case sections, final CTA, and footer links to auth/legal pages.
2. Login is email/password with `redirectTo`, forgot-password, verification banners, and a disabled "Continue with Google (Coming Soon)" path. Signup is email/password/username plus terms and shows success/error state.
3. Dashboard loads the user's alignments and partners, shows "Start New Alignment", partner search, a bell icon, a user dropdown, and an "Add Partner" modal.
4. The dashboard Add Partner modal searches `/api/partners/search`, but submit posts to `/api/partners/add`, which is not present in the app tree.
5. `/alignment/new` lets the creator choose one of six templates or type a custom description. Non-custom cards immediately create a draft alignment and route to clarity; custom waits for text and a button press.
6. Clarity is three accordions: decision, partner, and desired outcome. Only the first is open by default; Continue is disabled until all three have content. Typed partner text is context, while selected existing partners are added as participants.
7. Continuing from clarity saves the draft, may add a selected existing partner, generates questions, and routes the current user to `/questions`.
8. Questions renders one generated question at a time, autosaves answers after a debounce, offers AI help, shows tiny dot navigation, and submits by updating `submitted_at` before routing to `/waiting`.
9. Waiting shows the creator's submitted status and the partner's joined/submitted status. If the partner has not joined, the page says to share the invite link, but neither `ShareLinkButton` nor `InviteStatus` is mounted there.
10. `/join/[token]` validates the invite, shows auth CTAs or a join button, and routes both newly joined users and existing participants to `/alignment/[id]/clarity`.
11. Analysis server-generates a report when needed, then shows aligned items, conflicts, assumptions, gaps, imbalances, and one action card to resolve conflicts or generate a document.
12. Resolution walks conflicts one at a time, stores local drafts, submits resolution picks, and then shows an in-route waiting state or max-rounds terminal state.
13. Document generates the agreement HTML client-side, shows signature status, lets the current user sign through checkbox consent plus a button, and only shows download/share actions after both signatures exist.

## Recommendations

### P0 Mount the invite link where waiting tells users to share it

Files: `app/alignment/[id]/waiting/waiting-client.tsx`, `components/alignment/ShareLinkButton.tsx`, `components/alignment/InviteStatus.tsx`

Plan: Import `ShareLinkButton` or `InviteStatus` into `waiting-client.tsx` and render it directly under the partner status card when `!partnerJoined && !partnerSubmitted`. Change the status detail from "Share the invite link with your partner" to a direct instruction like "Copy this invite link and send it to your partner." Keep this as a UI mount only; do not change invite backend behavior.

Risk: Low. This exposes an existing component in the page that already promises the action.

### P0 Save final questionnaire answers before marking responses submitted

Files: `app/alignment/[id]/questions/questionnaire-client.tsx`

Plan: Replace the submit-time `update({ submitted_at })` with one final upsert that writes the current `answers` payload and `submitted_at` together for `alignment_id,user_id,round`. Reuse the existing `saveAnswers` payload shape or extract a `persistAnswers({ submittedAt })` helper so the last edited answer cannot miss the debounce window. Replace the two `alert()` calls with inline error state, and on invalid submit route the user to the first unanswered required question.

Risk: Moderate. It changes submit persistence, but it removes the current race where a user can proceed while the last answer is not saved.

### P0 Require an actual selected compromise in resolution

Files: `app/alignment/[id]/resolution/resolution-form.tsx`, `app/api/alignment/[id]/submit-resolution/route.ts`

Plan: Add a local `isResolutionComplete` helper. Treat `ai_suggestion` as complete only when `selected_option` is present, `custom` as complete only when `custom_solution.trim()` exists, and accept-own/accept-partner as complete as-is. Do not initialize every conflict to a submit-ready `ai_suggestion`; either initialize `selected_option: "suggestion_0"` only when a rendered suggestion exists or leave the conflict unanswered. Mirror the same validation in the API schema/refine so bare `ai_suggestion` submissions are rejected.

Risk: Moderate. Existing incomplete resolution payloads will start failing validation, which is the intended correction.

### P0 Fix person A/person B ownership before users accept positions

Files: `app/api/alignment/analyze/route.ts`, `app/alignment/[id]/analysis/page.tsx`, `app/alignment/[id]/resolution/page.tsx`, `app/alignment/[id]/resolution/resolution-form.tsx`

Plan: Persist or derive the response owner mapping used by analysis. The current analysis input is ordered by `user_id`, so save `personAUserId` and `personBUserId` in the analysis summary/details going forward, and for existing analyses derive the same order from participants sorted by `user_id`. In analysis, label positions with participant names instead of "Position A/B". In resolution, swap displayed responses when the current user is person B so "Your Position" and "Accept My Position" never point at the partner's answer.

Risk: Moderate. This touches display semantics around conflict choices, but it prevents users from accepting the wrong person's position.

### P1 Auto-advance the resolution waiting state

Files: `app/alignment/[id]/resolution/resolution-form.tsx`, `app/lib/hooks/useAlignmentUpdates.ts`

Plan: When `hasUserSubmitted && !hasPartnerSubmitted`, subscribe or poll for the next-round resolution response count and alignment `current_round/status`. If the partner submits, either push to `/alignment/${alignmentId}/analysis?reanalyze=true` when re-analysis should begin or call `router.refresh()` when the server needs to re-render the capped/max-rounds state. Add a small "Checking for updates..." line and a manual Refresh button beside Return to Dashboard.

Risk: Low to moderate. It reuses existing status checks, but the worker should avoid starting duplicate analysis calls from the client.

### P1 Route join success through the alignment status router

Files: `app/join/[token]/page.tsx`, `app/join/[token]/JoinAlignmentClient.tsx`

Plan: Change existing-participant redirects and successful join navigation from `/alignment/${alignment.id}/clarity` to `/alignment/${alignment.id}`. Let `app/alignment/[id]/page.tsx` decide whether the user belongs in clarity, questions, waiting, analysis, resolution, or document. Do not change auth account-creation behavior in this ticket.

Risk: Low. This uses the router page that already owns phase selection.

### P1 Remove or repoint the broken dashboard Add Partner flow

Files: `app/dashboard/DashboardClient.tsx`, `components/dashboard/AddPartnerModal.tsx`, `components/dashboard/PartnersList.tsx`

Plan: Remove the Add Partner modal/button for now, or replace the button with "Start an alignment" that routes to `/alignment/new`. Update the empty partners copy to say partners appear after they join an alignment. Do not add a new `/api/partners/add` endpoint in this ticket; the product journey currently invites per alignment.

Risk: Low. It removes a visible 404 path and aligns the dashboard with the actual invite model.

### P1 Make clarity validation and invite semantics visible

Files: `app/alignment/[id]/clarity/ClarityForm.tsx`

Plan: Keep Continue clickable unless generation is running, then have `handleContinue` open and focus the first missing accordion section with the existing error text. Add compact "Missing" or "Done" text in each accordion summary so closed required fields do not hide why the user is stuck. Change the partner helper text to clarify that typing an email/name is context only and that the real invite link is shared after answers are submitted.

Risk: Low. This is local state, focus, and copy around the existing save/generate behavior.

### P2 Make document signing states honest and escapable

Files: `app/alignment/[id]/document/page.tsx`, `app/alignment/[id]/document/components/document-header.tsx`, `app/alignment/[id]/document/components/signature-section.tsx`, `app/alignment/[id]/document/components/document-actions.tsx`

Plan: Add a simple top action row with Back to Dashboard on the document page, visible before and after signing. Change "Draw or type your signature here" to "Confirm your digital signature as {currentUserName}" because the UI has no signature input. Remove "They will be notified" unless a sign-waiting notification is actually sent. After the current user signs, show Back to Dashboard and a manual Refresh button; after both sign, include Back to Dashboard and Start New Alignment alongside Download/Share.

Risk: Low. This is copy and navigation state, not signature storage behavior.

### P2 Remove fake or dead controls in first-session chrome

Files: `app/(auth)/login/page.tsx`, `app/dashboard/DashboardClient.tsx`, `components/homepage/UseCases.tsx`

Plan: Remove the disabled Google button and "OR" divider until OAuth exists. Remove the dashboard bell icon unless it opens a real empty notifications popover, and remove the Profile menu item unless `/profile` exists. Remove `tabIndex={0}` from use-case cards because they are not clickable controls. Keep the visual layout otherwise unchanged.

Risk: Low. This reduces confusion and keyboard noise without changing the core journey.
