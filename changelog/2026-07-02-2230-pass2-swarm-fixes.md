# 2026-07-02 22:30 — Pass 2: scout-directed swarm fixes (invite RPCs, analyze resilience, signature integrity, UX)

## What Changed
Six parallel Codex workers (Ringer run ha-pass2-workers, identity accord), each from an implementation-ready scout brief, integrated onto one branch:
- **Invite join finally works end-to-end (code + migration)**: SECURITY DEFINER RPCs `get_alignment_invite_preview` / `redeem_alignment_invite` (migration 20260703000100) give anonymous preview (title/creator/expiry only) and atomic redemption (participation-before-usage, row lock, unique-violation idempotency); join page/API rewritten onto them; signup now carries `redirectTo` like login; auth callback unwraps nested callback destinations; join lands on the phase router.
- **Analyze API is resilient** (migration 20260703000200 adds analyzing→active): concurrent callers get 202 in-progress instead of 409 crashes; failures roll the status lock back; stale locks (>5 min, no analysis row) self-recover; analysis page renders a polling progress client instead of fetch-during-server-render; person A/B user-id mapping persisted in analysis details and displayed with real names.
- **Agreement integrity** (migration 20260703000300): new immutable `alignment_agreement_snapshots` table (one per round, update/delete blocked by trigger); both parties sign the same snapshot hash (`reviewedSnapshotHash` review flow, 409 DOCUMENT_REVIEW_REQUIRED on drift); document HTML server-rendered/sanitized/persisted; `assertReadyForDocument` gates page + sign + generate-document on zero conflicts; signing idempotent; completion email sent only by the transitioning request; PDF export includes signatures.
- **Flow/UX**: ShareLinkButton mounted on waiting page, live InviteStatus in clarity (creator-only); questionnaire submit is one atomic upsert (answers + submitted_at) with inline errors; resolution requires an actual selected compromise (client + zod); resolution waiting auto-advances via status polling; position ownership displayed viewer-correctly; dead Google button and UseCases tabIndex removed.
- **Dashboard**: server-side initial data hydrated into hooks via shared app/lib/dashboard-data.ts; `aligned_awaiting_signatures` derived (pure helper, RPC-swappable); Add Partner dead flow replaced with Start an alignment.
- **Theme/loading**: light-era storageKey (legacy dark localStorage no longer wins), Inter swap/Manrope fallback font display, deterministic ThemeToggle, root loading.tsx deleted, static token-based skeletons, reduced-motion guard.

## Why
Second full user-journey pass. Scouts (6 read-only Codex agents) verified pass-1 fixes and produced implementation-ready briefs; Claude triaged into disjoint work packages; workers implemented in isolated git worktrees with executed tsc verification.

## Testing
Per-worktree `tsc --noEmit` (executed by Ringer checks), then integrated: type-check, lint, production build all green. Runtime two-browser QA still recommended before announcing.

## Migrations (NOT applied to prod yet)
20260703000100_fix_invite_join_rpc.sql, 20260703000200_allow_analyzing_rollback.sql, 20260703000300_create_alignment_agreement_snapshots.sql — apply in order after PR review.

## Next Steps
1. Apply the three migrations to prod (in order) after merge.
2. Deferred by design: response-visibility RLS tightening pass (scout brief saved in audits), submit-side analysis initiation, server-side PDF.
3. Two-browser manual QA of invite → join → answer → analyze → resolve → sign.
