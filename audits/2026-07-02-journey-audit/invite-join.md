# invite-join audit

## Verdict
ISSUES-FOUND

## Findings

### high CONFIRMED Generated invite links are rejected by the join-page token validator
File: app/lib/invite-tokens.ts:25
What happens: `generateToken()` uses `crypto.randomBytes(32).toString('base64url')`, which produces a 43-character base64url token for 32 bytes of entropy, but `isValidTokenFormat()` only accepts exactly 64 characters at app/lib/invite-tokens.ts:54-56. Generated URLs from app/api/alignment/[id]/generate-invite/route.ts:80-124 therefore fail the first check in app/join/[token]/page.tsx:38-40 and would also fail the API check in app/api/alignment/join/route.ts:130-136.
User-visible effect: Both logged-out and logged-in partners opening a freshly generated invite see "Invalid Invitation Link" and can never reach signup/login or acceptance.
Fix sketch: Pick one token representation and use it everywhere. For the current 256-bit base64url model, validate 43-character base64url tokens and update docs/tests. If the app really wants 64 visible characters, generate a 32-byte hex token or a 48-byte base64url token and hash that consistently.

### high CONFIRMED Token preview and redemption use an RLS-bound client that non-participants cannot use
File: app/api/alignment/join/route.ts:141
What happens: The public join page selects `alignment_invitations` with `createServerClient()` before auth at app/join/[token]/page.tsx:79-100; that server client uses the anon key at app/lib/supabase-server.ts:61-64. The invitation RLS policies only allow the invite creator or existing participants to view invites at supabase/migrations/20251110133651_add_alignment_invitations.sql:38-52. The POST route has the same problem after `requireAuth()`: a newly authenticated partner is not the creator and not yet a participant when app/api/alignment/join/route.ts:141-145 looks up the invite. Even after lookup, partner insertion is blocked by the creator-only insert policy at supabase/migrations/20251111011843_fix_all_participant_policies.sql:26-34.
User-visible effect: After the token-length bug is fixed, logged-out users will get "Invitation Not Found" instead of the preview, and logged-in non-participants will get a join error before a participant row can be created.
Fix sketch: Move invite preview/redemption behind a narrow server-side service-role path or a SECURITY DEFINER RPC. The RPC should validate the token hash, expiry, invalidation, usage limit, and alignment status, then claim usage and insert the participant in one transaction.

### medium CONFIRMED Signup loses the invite return URL
File: app/join/[token]/JoinAlignmentClient.tsx:86
What happens: The join page sends logged-out users to `/signup?redirectTo=/join/<token>` at app/join/[token]/JoinAlignmentClient.tsx:86-88, but the signup page never reads `redirectTo` or includes a hidden field in its form at app/(auth)/signup/page.tsx:36-86. The signup action sends Supabase to `/auth/callback` without the join target at app/(auth)/signup/actions.ts:145-153, redirects immediate-session signups to `/dashboard` at app/(auth)/signup/actions.ts:213-215, and the callback defaults non-recovery confirmations to `/dashboard` at app/auth/callback/route.ts:120-124. Login does preserve this path via app/(auth)/login/page.tsx:37-39 and app/(auth)/login/actions.ts:130-133.
User-visible effect: A logged-out partner who chooses Create Account loses the tokenized invite path and lands on the dashboard instead of returning to `/join/[token]`.
Fix sketch: Mirror the login flow in signup: read `redirectTo`, submit it as a hidden field, validate it as a safe same-site path, use it for immediate-session redirects, and include it in the email confirmation callback destination.

### medium CONFIRMED Refreshing a used invite checks usage before existing participation
File: app/join/[token]/page.tsx:235
What happens: The join page checks `current_uses >= max_uses` at app/join/[token]/page.tsx:235-271 before it authenticates the current user and checks whether they are already a participant at app/join/[token]/page.tsx:313-327. The API route has the same ordering: usage limit at app/api/alignment/join/route.ts:176-184 comes before the existing-participant check at app/api/alignment/join/route.ts:186-206.
User-visible effect: After a successful single-use join, opening or refreshing the same invite link shows "Invitation Limit Reached" instead of redirecting the already-joined partner into the alignment.
Fix sketch: For authenticated users, check existing participation before the usage-limit rejection. Make join acceptance idempotent for existing participants by returning success/redirect without incrementing usage again.

### medium CONFIRMED Creator-side partner-joined status is static and the invite UI is not mounted in the create flow
File: components/alignment/InviteStatus.tsx:31
What happens: `InviteStatus` fetches participants once on mount at components/alignment/InviteStatus.tsx:31-34 and renders "Partner Joined" only from that local state at components/alignment/InviteStatus.tsx:98-139. There is no polling or realtime subscription in this component. `ShareLinkButton` has a 60-second interval, but it only recalculates expiration days at components/alignment/ShareLinkButton.tsx:72-88; it does not refetch participants or invite status. A repo-wide search found no `<InviteStatus>` or `<ShareLinkButton>` mount outside their own component definitions, while the available realtime partner-join hook lives separately at app/lib/hooks/useAlignmentUpdates.ts:204-220.
User-visible effect: The creator does not get a live "partner joined" update from this UI. In the current `/alignment/new` to `/alignment/[id]/clarity` flow, the token invite UI is not surfaced at all; if mounted later, the joined state updates only after a manual refresh or explicit refetch.
Fix sketch: Mount the invite/status component in the creator's waiting/share surface and wire `useAlignmentUpdates({ alignmentId, onPartnerJoin })` to update participant state. If realtime is unavailable, add explicit polling/refetch on visibility/focus.

### medium CONFIRMED Invite tokens are stored as recoverable ciphertext, not hash-only
File: app/api/alignment/[id]/generate-invite/route.ts:80
What happens: The route generates a raw token, encrypts it with `encryptInviteToken()`, and inserts both `token_hash` and `token_ciphertext` at app/api/alignment/[id]/generate-invite/route.ts:80-99. The current-invite endpoint decrypts that ciphertext to reconstruct the share URL at app/api/alignment/[id]/invite/route.ts:81-83. The migration also adds `token_ciphertext` at supabase/migrations/20250120120000_add_clarity_draft_and_invite_usage.sql:5-7.
User-visible effect: This contradicts the stated hash-only token storage model. It is not a UX crash, but it means invite URLs are recoverable from database ciphertext plus `INVITE_TOKEN_SECRET` until expiry/revocation.
Fix sketch: Decide explicitly. For strict hash-only storage, remove `token_ciphertext`, return the raw token once, and make the UI explain that the link cannot be recovered after leaving the page. If recoverable links are desired, update the security model and treat the encryption secret as token-equivalent.

## Flow trace

1. Creator opens `/alignment/new`. The server component requires a user and redirects unauthenticated visitors to `/login` without a return URL at app/alignment/new/page.tsx:26-34.
2. Creator selects a template or submits custom text. `NewAlignmentClient` inserts an `alignments` row with `status: 'draft'`, `created_by: userId`, and `partner_id: null`, then inserts the creator into `alignment_participants` as `role: 'owner'`, then routes to `/alignment/<id>/clarity?...` at app/alignment/new/NewAlignmentClient.tsx:90-127 and app/alignment/new/NewAlignmentClient.tsx:147-187.
3. In the actual clarity flow, the token invite UI is not mounted. The clarity form can add an already-selected existing partner directly to `alignment_participants` at app/alignment/[id]/clarity/ClarityForm.tsx:404-437, but the tokenized invite controls are only present in unused `InviteStatus`/`ShareLinkButton` components.
4. If `ShareLinkButton` were mounted, it would fetch `/api/alignment/<id>/invite` on mount at components/alignment/ShareLinkButton.tsx:40-70. A 404 shows "Generate Link"; clicking it POSTs `/api/alignment/<id>/generate-invite` at components/alignment/ShareLinkButton.tsx:130-164.
5. The generate route authenticates the creator, verifies `alignment.created_by === user.id`, generates an invite, stores `token_hash` plus `token_ciphertext`, sets `max_uses: 1`, `current_uses: 0`, updates `alignments.current_invite_id`, and returns `/join/<token>` at app/api/alignment/[id]/generate-invite/route.ts:47-165.
6. With the current code, the returned token is 43 characters, so both logged-out and logged-in partners opening `/join/[token]` fail `isValidTokenFormat()` and see "Invalid Invitation Link" at app/join/[token]/page.tsx:38-74. The acceptance flow stops here.
7. If token validation is fixed, the logged-out partner still hits an RLS-bound invitation lookup before auth at app/join/[token]/page.tsx:79-100. The current invitation policies do not allow anonymous/nonparticipant preview, so the page returns "Invitation Not Found" instead of auth CTAs.
8. If preview access is fixed, the logged-out login path preserves the token: `JoinAlignmentClient` sends `/login?redirectTo=/join/<token>`, the login form submits that hidden value, and `loginAction` redirects back to it after password login. The signup path does not preserve it and lands on dashboard after immediate signup or confirmation.
9. If an authenticated nonparticipant reaches POST `/api/alignment/join`, the route requires auth, validates token format, looks up the invitation, checks revoked/expired/used, checks duplicate participation, calls `increment_invite_usage`, then inserts a `role: 'partner'` row at app/api/alignment/join/route.ts:114-231. In current RLS, the invite lookup and partner insert are blocked before the intended success path.
10. Intended double-accept behavior is partly designed: `increment_invite_usage` atomically increments only while `current_uses < max_uses` at supabase/migrations/20250120120000_add_clarity_draft_and_invite_usage.sql:19-27, and `alignment_participants` has a unique `(alignment_id, user_id)` constraint at supabase/migrations/20251110051815_init_human_alignment.sql:39-47. The current page/API ordering still gives the wrong "limit reached" UX to already-joined users on refresh.
11. On intended success, `JoinAlignmentClient` routes to `/alignment/<id>/clarity` at app/join/[token]/JoinAlignmentClient.tsx:64-65. For `draft`, that is the phase page. For `active`, `analyzing`, `resolving`, and `complete`, the clarity page redirects to `/questions`, `/analysis`, `/resolution`, or `/document` at app/alignment/[id]/clarity/page.tsx:55-69. The top-level `/alignment/[id]` router has the cleaner status map at app/alignment/[id]/page.tsx:36-50.
12. Invalid format, missing, revoked, expired, usage-limit, complete, and cancelled invitations render friendly error pages in app/join/[token]/page.tsx rather than crashing. The "cancelled" branch is dead against the current status type/schema, which only include `draft`, `active`, `analyzing`, `resolving`, and `complete`.
