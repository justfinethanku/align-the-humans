# Shit You Need To Fix

1. **Edge middleware is bundling Node-only Supabase clients**  
   - Evidence: `middleware.ts:18-134` imports `createServerClient` from `@supabase/ssr` and is executed inside Next.js middleware (Edge). Running `npm run build` logs `A Node.js API is used (process.version...) which is not supported in the Edge Runtime` for `@supabase/realtime-js` and `@supabase/supabase-js`.  
   - Impact: Middleware will crash once deployed to Vercel Edge (no `process`/`Buffer`), so auth redirects will fail and every protected route will throw.  
   - Fix: Replace the middleware client with the Edge-safe helper (`createMiddlewareClient` from `@supabase/auth-helpers-nextjs`) or move the auth check to a Node runtime (e.g., rewrite to server actions). Do not bundle `@supabase/supabase-js` in middleware.

2. **Just opening the invite UI mints brand new tokens**  
   - Evidence: `components/alignment/ShareLinkButton.tsx:36-73` calls `fetch('/api/alignment/${alignmentId}/generate-invite', { method: 'POST' })` on mount, so every render hits the “create” endpoint. `app/api/alignment/[id]/generate-invite/route.ts:70-118` always inserts a new row and never invalidates prior tokens.  
   - Impact: Every page view creates another invite, so “share this link” silently rotates tokens and leaves old ones active in the database. Users can easily send a link and then invalidate it by simply revisiting the dashboard, confusing partners and bloating `alignment_invitations`.  
   - Fix: Add a read endpoint (or Supabase query) that returns the current invite without generating a new one, and only hit the POST when the user explicitly clicks “Generate/Regenerate”. Also invalidate previous invites when issuing a fresh token from the same endpoint.

3. **Unauthenticated redirects point to a non-existent route**  
   - Evidence: `app/alignment/[id]/questions/page.tsx:30-35`, `app/alignment/[id]/analysis/page.tsx:154-161`, and `app/alignment/[id]/resolution/page.tsx:29-35` all do `redirect('/auth/login')`, but the actual login page lives in `app/(auth)/login/page.tsx` (route `/login`).  
   - Impact: Signed-out users get a 404 instead of the login screen when they follow an invite or bookmarked URL.  
   - Fix: Redirect to `/login` (and include the `redirectTo` param) or share a utility that always points to the real auth route.

4. **/api/alignment/get-suggestion is publicly callable**  
   - Evidence: `app/api/alignment/get-suggestion/route.ts:14-205` never creates a Supabase server client or checks auth/authorization; it just streams prompts to Claude.  
   - Impact: Anyone who finds the endpoint can hammer your Anthropic quota without logging in, because it only takes question text in the body.  
   - Fix: Require `createServerClient`/`requireAuth`, and ideally verify the requester is a participant in the relevant alignment before running the model.

5. **Signatures do not validate the requested round**  
   - Evidence: `app/api/alignment/[id]/sign/route.ts:195-220` parses `{ round }` from the body but never compares it to `alignment.current_round`. `allSigned` then triggers a status change to `complete` even if users sign an old snapshot.  
   - Impact: A malicious or mistaken client can POST an outdated round number, instantly mark “both signed”, and move the alignment to complete without resolving the latest round.  
   - Fix: Reject requests where `round !== alignment.current_round`, and ensure the canonical snapshot is built from that current round only after both current responses exist.

6. **Clarity form never persists desired outcomes/partner info**  
   - Evidence: The autosave effect in `app/alignment/[id]/clarity/ClarityForm.tsx:107-141` only depends on `topic` and `saveProgress()` only PATCHes `{ title: topic }`. There is no call that stores `desiredOutcome` or `partnerText`, despite the UI promising auto-save.  
   - Impact: If a user writes out the desired outcome or partner details and navigates away (or refreshes) before generating questions, all of that input is lost.  
   - Fix: Persist the full clarity payload (topic, partner relationship, desired outcome) to the database—either add columns/JSON on `alignments` or a `clarity_drafts` table—and trigger autosave when any of those fields change.

7. **Analysis assigns “Person A/B” randomly**  
   - Evidence: `getRoundResponses` (`app/lib/db-helpers.ts:342-354`) fetches submissions without ordering, and `analyzeResponses` (`app/api/alignment/analyze/route.ts:299-313`) simply destructures `const [responseA, responseB] = responses`. Which participant becomes “Person A” therefore depends on Postgres row order.  
   - Impact: The same participant can flip between A/B across analyses, so conflicts and agreement summaries show the wrong person’s statements, and signatures reference inconsistent sides.  
   - Fix: Order the responses deterministically (e.g., by `alignment_participants.role`, submission timestamp, or user ID) before feeding them into the AI prompt and downstream summaries.

8. **Invite usage limits aren’t enforced under concurrency**  
   - Evidence: In `app/api/alignment/join/route.ts:176-230` you read `current_uses`, check against `max_uses`, insert the participant, then in a separate statement increment `current_uses`. There is no transaction or conditional update.  
   - Impact: Two parallel requests can both pass the limit check and add participants before either update runs, so a supposedly single-use invite can be redeemed multiple times.  
   - Fix: Perform the usage check/update atomically—e.g., wrap the participant insert + `current_uses = current_uses + 1` in a Postgres function or use `update ... set current_uses = current_uses + 1 where id = ... and current_uses < max_uses returning *` to enforce the cap.
