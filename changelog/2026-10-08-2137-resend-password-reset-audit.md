# Production password-reset email audit

**Keywords:** [RESEND] [AUTH] [TESTING] [AUDIT]
**Session:** 2026-10-08, America/New_York
**Commit:** this documentation commit; tested production commit `3eeac480ff8604c15dad846f3651232b293fec01`.

## What Changed
Added a production password-reset email recipe and observed failure to
`docs/testing-runbook.md`. No application code or Auth configuration changed.

## Why
The personal Resend migration had tested its key but not the real Auth email flow.

## How
With owner approval, submitted a single recovery request for the existing owner
account through the real production interface and checked logs and mailbox.

## Issues Encountered
The Auth email hook rejected the request with a missing-signature 401. Its
expected header/verification format differs from current Standard Webhooks.

## Dependencies
None. No key, schema, mailbox, or account changes.

## Testing
The production flow was exercised and failed before Resend sent a message.
No password was changed or recovery link followed. Documentation diff checked.

## Next Steps
Obtain separate approval for the signature-verifier repair, then repeat the real
production reset-email test. The private Fleet handoff holds account/evidence IDs.

## Impact Assessment
Documents an existing failure and preserves working password sign-in behavior.

## Lessons Learned
A successful mail-provider API test does not verify the Auth send-email hook.
