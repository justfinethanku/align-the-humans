# Changelog: Clarity Draft Persistence & Secure Invites

**Date:** 2025-11-10 21:05  
**Session:** Clarity + Invite Hardening  
**Agent:** Codex

## What Changed

### New Files
1. **`supabase/migrations/20250120120000_add_clarity_draft_and_invite_usage.sql`**
   - Adds the `clarity_draft` JSONB column to `alignments`
   - Persists encrypted invite tokens via `token_ciphertext`
   - Introduces `increment_invite_usage` / `decrement_invite_usage` RPC functions for concurrency-safe invite redemption
2. **`app/api/alignment/[id]/invite/route.ts`**
   - Read-only endpoint that decrypts and returns the current active invite token for creators

### Key Files Modified
1. **`app/alignment/[id]/clarity/page.tsx` & `ClarityForm.tsx`**
   - Hydrate form from saved `clarity_draft`
   - Autosave topic/partner/outcome via the update API instead of title only
2. **`app/api/alignment/[id]/update/route.ts` & `app/lib/db-helpers.ts`**
   - Accept and persist typed clarity drafts (now aligned with new DB schema)
3. **Invite Flow**
   - `app/lib/invite-tokens.ts`: Encrypts tokens with `INVITE_TOKEN_SECRET`
   - `app/api/alignment/[id]/generate-invite/route.ts` & `regenerate-invite/route.ts`: store ciphertext, no longer expose raw tokens unless explicitly generated
   - `components/alignment/ShareLinkButton.tsx`: loads existing invite via GET endpoint, offers explicit “Generate” action, and stops auto-minting tokens
   - `app/api/alignment/join/route.ts`: uses RPC to atomically claim invite usage and rolls back if participant insert fails
4. **Security Hardening**
   - `middleware.ts`: swaps to Edge-safe `createMiddlewareClient`
   - `app/api/alignment/get-suggestion/route.ts`: requires authenticated participants and the client now sends `alignmentId`
   - `app/alignment/[id]/analysis|questions|resolution/page.tsx`: redirect to `/login?redirectTo=...` instead of dead `/auth/login`
   - `app/api/alignment/[id]/sign/route.ts`: enforces signing only on the current round
   - `app/lib/db-helpers.ts`: deterministic ordering in `getRoundResponses` to keep “Person A/B” stable
5. **Docs**
   - `README.md`: documents the required `INVITE_TOKEN_SECRET`

## Why

- **Clarity autosave gaps:** Users were losing partner/outcome context because only the title field was persisted. Storing drafts unblocks multi-session flows.
- **Invite token churn & security risks:** The UI created a new invite on every render and tokens were stored in plain text. Encrypting tokens + adding a read endpoint keeps invites stable and secret.
- **Auth vulnerabilities:** Middleware was bundling Node-only Supabase clients, AI suggestion API was unauthenticated, and signature requests could target stale rounds.
- **Deterministic analysis:** Without ordering, AI reports randomly swapped participant perspectives, confusing downstream UI.

## Testing

- `npm run lint`
- `npm run type-check`
- `npm run build`

> ⚠️ After pulling these changes, run `supabase db push` and set `INVITE_TOKEN_SECRET` in `.env.local` before restarting the dev server.
