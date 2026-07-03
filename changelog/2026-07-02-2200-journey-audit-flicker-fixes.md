# 2026-07-02 22:00 — Full user-journey audit (Ringer swarm) + flicker/flow fixes

## What Changed
- **Audit**: Ran a 7-worker parallel Codex audit (Ringer orchestrator, run `ha-journey-audit-20260703T010436Z-p86434`) covering the entire user journey: theme/rendering, dashboard realtime, auth, invite/join, questions/waiting, analysis/resolution, document/signatures. All 7 raw reports archived in `audits/2026-07-02-journey-audit/`.
- **P0 fix — invite tokens** (`app/lib/invite-tokens.ts`): `isValidTokenFormat` required 64 chars but `generateToken()` (32 bytes base64url) produces 43 — every freshly generated invite link was rejected at `/join/[token]` and `/api/alignment/join`. Validator now matches reality (43-char base64url).
- **P0 fix — DB state machine** (`supabase/migrations/20260702130000_allow_reanalysis_transition.sql`): prod trigger `validate_alignment_transition()` only allowed the linear chain, rejecting the `resolving → analyzing` lock the analyze API needs for re-analysis rounds — resolution round 2 was unreachable. Migration mirrors `VALID_STATUS_TRANSITIONS`. **NOT yet applied to prod** (blocked pending explicit approval).
- **Flicker fix — dashboard**: `useDashboardData.fetchAlignments` no longer sets `loading=true` on refetch (realtime events were blanking the alignment list to a spinner); `useAlignmentUpdates` now keeps event callbacks in a ref so inline callbacks don't tear down/recreate the realtime channel on every render; `DashboardClient` passes memoized handlers.
- **Flicker fix — theme**: `disableTransitionOnChange` on `ThemeProvider` (theme class swaps no longer animate every `transition-colors` surface).
- **Flow fix — waiting page** (`waiting-client.tsx`): single `goToAnalysis()` guard (navigate-once ref + `router.replace`) across the three competing navigation paths (initial state, realtime, 10s poll).
- **Flow fix — phase router** (`app/alignment/[id]/page.tsx`): `active` status now routes users who already submitted to `/waiting` instead of back into the editable questionnaire.
- **Flow fix — resolution form**: first submitter now stays on `/resolution` (refresh → server renders the waiting state) instead of being pushed to `/analysis?waiting=true`, which showed the stale report.

## Why
Jon reported "weird flickering" and asked for a journey debug. The audit confirmed the flicker sources (dashboard refetch spinner + realtime resubscribe churn + theme transitions) and surfaced two P0 flow breaks: invite links have never been redeemable, and the resolution loop dead-ends at the DB trigger.

## How
Ringer manifest with 7 read-only audit tasks (gpt-5.5 xhigh workers, executed structural checks, 7/7 PASS attempt 1, ~1.25M worker tokens). Claude verified the load-bearing claims in code and against the live prod DB (trigger def + RLS policies via Supabase MCP), then applied fixes.

## Issues Encountered
- Prod DDL application denied by permission classifier — migration awaits Jon's approval.
- **Still open (not fixed here, see audit reports)**: invite-join RLS blocks anonymous invite preview and partner self-insert (needs SECURITY DEFINER RPC design); signup drops `redirectTo` (invite return URL lost); analyze API strands alignments in `analyzing` on failure (no rollback/retry path); analyze 409 → error boundary for the losing party on concurrent handoff; canonical snapshots are per-signature (signers can sign different hashes); PDF export omits signatures; response RLS lets a technical user read partner answers after both submit but before analysis; persisted `theme=dark` localStorage still overrides the new light default for returning users; invite UI (`ShareLinkButton`/`InviteStatus`) isn't mounted anywhere in the create flow.

## Dependencies
None added.

## Testing
`npm run type-check`, `npm run lint`, `npm run build` all green. Runtime verification of flicker fixes pending (dev-server session).

## Next Steps
1. Jon: approve applying `20260702130000_allow_reanalysis_transition.sql` to prod.
2. Design + implement invite redemption RPC (SECURITY DEFINER) to unblock the partner-join flow end to end.
3. Preserve `redirectTo` through signup.
4. Analyze API: idempotent in-flight handling + `analyzing` stranded-state recovery.
5. Signature snapshot freeze (one immutable snapshot per round, both parties sign the same hash).
