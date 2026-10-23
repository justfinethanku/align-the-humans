# Auth email hook signature

**Keywords:** [AUTH] [EMAIL] [WEBHOOK] [SECURITY]
**Session:** 2026-10-23
**Commit:** `3481d5c8f30880f0c7491310a549e1ff610d87e4`

## What Changed
`POST /api/auth/email` now verifies Supabase Send Email hooks with the Standard Webhooks headers (`webhook-id`, `webhook-timestamp`, `webhook-signature`) and `SUPABASE_AUTH_HOOK_SECRET`. Unit tests cover a valid signature, a missing signature, a wrong signature, a stale signature, and each email action type the route handles.

## Why
Production password-reset mail was rejected with 401 `Missing webhook signature` because the route required `x-supabase-webhook-signature`. Supabase signs this hook with Standard Webhooks and does not send that header, so Resend never received the request.

## How It Was Done
Signature checks live in `app/api/auth/email/hook.ts` and use `node:crypto`. The signed content is `${webhook-id}.${webhook-timestamp}.${rawBody}`, the key is the base64 payload after `whsec_`, and timestamps outside five minutes are rejected. No verification bypass and no new dependency.

## Issues Encountered
Vercel no longer retains the 2026-10-09 production log line. The route's 401 text, Supabase's hook signer, and the documented upstream `Hook requires authorization token` response identify the same failure.

## Dependencies
None added.

## Testing Notes
`npm test` passed 7 tests: valid, missing, wrong, and stale signatures, a future timestamp, production with no secret, and signup, email change, magic link, recovery, invite, and reauthentication. `npm run lint`, `npm run type-check`, and `npm run build` passed. A signature from `standardwebhooks` 1.0.0 was accepted by the compiled verifier, including Supabase's comma-space multi-secret header. A live production reset was not sent.

## Next Steps
Confirm the dashboard hook URL and that `SUPABASE_AUTH_HOOK_SECRET` is the same `v1,whsec_` value Supabase uses, deploy, then repeat one approved password-reset request.

## Impact Assessment
Auth mail that reaches this hook can be verified and sent. Requests with a missing, invalid, or stale signature are still rejected.

## Lessons Learned
A Resend API check does not prove the Auth hook accepts Supabase's signature.
