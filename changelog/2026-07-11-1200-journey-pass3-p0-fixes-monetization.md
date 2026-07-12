# 2026-07-11 12:00 — Journey pass 3: P0 RLS/profile fixes, Codex co-work, monetization groundwork

## What Changed
- New migration `20260711120000_fix_journey_p0_profiles_rls.sql`:
  - `handle_new_user()` trigger on `auth.users` + backfill — profiles were never created
    for any new user (signup's client upsert had no INSERT policy), which FK-broke
    invite generation for every new account.
  - Replaced `responses_read_after_both_submitted` RLS policy which subqueried its own
    table (`alignment_responses`) → Postgres 42P17 infinite recursion on EVERY response
    save. Answers could not be saved on prod at all. New `both_responses_submitted()`
    SECURITY DEFINER helper.
  - `participants_read_members` policy: all alignment members can now see all
    participant rows (was: own row + creator-only), which had locked invited partners
    out of resolution and corrupted sign-completion counting.
  - FK `alignment_participants.user_id → profiles(id)` so the PostgREST embed
    `profiles:user_id(display_name)` works, plus `profiles_read_shared` policy +
    `shares_alignment_with()` helper so partners can read each other's display names.
- (Codex/GPT-5.6 run B, same branch): atomic sign completion RPC, questionnaire
  immutability guard, analyze status repair, question-gen persistence — see commits.

## Why
Jon: get the entire app working start to finish, then produce a narrated demo video.
Live walkthrough with two fresh test accounts (jon+hatest1/2@aicred.ai) hit
"Failed to submit responses" — root causes above, confirmed live against prod and
independently by a GPT-5.6 sol full-journey code audit (report in scratchpad collab dir,
also summarized in audits/ if promoted).

## How
Claude walked prod in a browser (chrome-devtools MCP, two isolated contexts) while
GPT-5.6 (codex exec, sol high) audited code; findings merged; fixes split and
cross-reviewed between the two models.

## Issues Encountered
- Prod RLS state had drifted from checked-in migrations in spirit (recursive policy
  shipped in init migration and never replaced).
- Admin-created users (via auth admin API) also get no profile row — trigger now covers.

## Dependencies
None new.

## Testing
- Reproduced each failure with curl against prod PostgREST before fixing.
- Post-migration: full two-account journey re-run on prod (see next steps).

## Next Steps
- Apply migration to prod after GPT-5.6 review; re-walk journey; demo video pipeline
  (screenshots → ElevenLabs VO → Remotion/ffmpeg).
- Monetization: 1 free alignment gate + Alignment Pulse recurring check-ins (memo in
  collab dir; Jon to review pricing).
