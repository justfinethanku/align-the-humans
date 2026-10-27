# ATH-18: Alert when the auth email hook or Resend send fails

**Keywords:** [OPS] [EMAIL] [RESEND] [AUTH] [ALERT] [ATH-18]
**Session:** 2026-10-27, evening UTC
**Commit:** 2156faf
**Linear:** ATH-18

## What Changed

- Added `app/lib/ops-alert.ts`. A 401 or 500 from `POST /api/auth/email`, and a rejected Resend send from the auth hook or `email-service`, calls `reportOpsAlert`.
- When `OPS_ALERT_EMAIL` is set, the first occurrence of that failure in a 15-minute window is emailed through the existing Resend account. Repeats stay in the logs.
- When `OPS_ALERT_EMAIL` is unset or has no usable address, the helper logs `[ops-alert]` with reason `unconfigured` and does not throw.
- Addresses and `whsec_` / `re_` secrets are redacted in the alert body.
- `npm test` covers recipient parsing, redaction, the unset path, coalescing, and a failed send.

## Why

Auth hook failures and Resend rejections only reached `console.error`. The Oct 8 password-reset outage was found by a hand-run test. The next outage needs to reach a person.

## How It Was Done

- No new monitoring vendor. The alert is a transactional email from `noreply@alignthehumans.com`.
- The auth route schedules the alert with `after()` so the hook response is not held open and the send is not dropped when the response returns.
- Coalescing uses the shared Postgres rate limit (one send per failure class per 15 minutes). A Resend idempotency key covers two instances that pass that check together.
- 400 and 429 responses are not emailed. A burst of unsigned probes still returns 401, and those share one alert per window.

## Issues Encountered

- None in unit tests, lint, or type-check.

## Dependencies

- No package changes.
- Production needs `OPS_ALERT_EMAIL` (comma-separated). The app keeps working when it is absent.

## Testing Notes

- `npm test`, `npm run lint`, and `npm run type-check`.
- Production proof is an unsigned POST to `/api/auth/email` after the merge deploy, then the inbox named by `OPS_ALERT_EMAIL`.

## Next Steps

- If unsigned probes make the 15-minute mail too frequent, lengthen the window for `Missing webhook signature` only. Invalid signatures, hook 500s, and Resend rejections should stay short.

## Impact Assessment

- Failure responses are unchanged. The new work is one coalesced email and a log line.
- A person sees the next auth-mail or Resend failure without watching Vercel logs.

## Lessons Learned

- Console logs did not page anyone. The alert had to be a message that already lands in an inbox the project can send to.
