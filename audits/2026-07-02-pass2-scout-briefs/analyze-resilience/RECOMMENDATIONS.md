# analyze-resilience scout

## Current state

- `app/api/alignment/analyze/route.ts` uses `alignments.status = 'analyzing'` as the analysis lock before fetching responses, calling the AI, or saving the analysis. The lock prevents duplicate token spend, but the current contract turns normal contention into a `409` and does not roll the status back if the lock holder fails.
- `app/alignment/[id]/analysis/page.tsx` triggers `/api/alignment/analyze` during server render when no current-round analysis exists. It then throws on any non-OK response from that POST, so a losing concurrent request can flash an error boundary while the winning request is still working.
- `app/alignment/[id]/waiting/waiting-client.tsx` already has a `navigatedRef`/`router.replace` guard in this checkout. The remaining race is at the analysis page/API boundary, not duplicate waiting navigation.
- `app/lib/db-helpers.ts` validates status transitions through `app/lib/types.ts` before status updates. `saveAnalysis()` inserts into `alignment_analyses`, which has a unique `(alignment_id, round)` constraint.
- The repo already has `supabase/migrations/20260702130000_allow_reanalysis_transition.sql`, so `resolving -> analyzing` is represented in the DB trigger. First-round rollback still needs `analyzing -> active`, which is not allowed in `VALID_STATUS_TRANSITIONS` or the DB trigger.
- `alignments.updated_at` is maintained by `trg_alignments_updated_at`, so it can be used as the stale-lock clock for an `analyzing` row with no current-round analysis.

## Recommendations

### [P0] Make analyze idempotent, rollback-safe, and stale-lock-aware

Files:
- `app/api/alignment/analyze/route.ts`
- `app/lib/types.ts`
- `supabase/migrations/<timestamp>_allow_analyzing_rollback.sql`

Plan:
1. Deploy the DB/types status-machine update before relying on rollback. Add `active` as a legal target from `analyzing` in `app/lib/types.ts`:

```ts
export const VALID_STATUS_TRANSITIONS: Record<AlignmentStatus, AlignmentStatus[]> = {
  draft: ['active'],
  active: ['analyzing'],
  analyzing: ['active', 'resolving'],
  resolving: ['complete', 'analyzing'],
  complete: [],
};
```

2. Add this migration. It preserves the existing `resolving -> analyzing` fix and adds only the rollback edge needed for failed first-round analysis:

```sql
-- Allow failed analysis runs to roll back to their pre-lock status.
-- First-round analysis locks active -> analyzing and must be able to roll back
-- analyzing -> active. Re-analysis locks resolving -> analyzing and already
-- rolls forward/back to resolving.

CREATE OR REPLACE FUNCTION public.validate_alignment_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  valid boolean := false;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'active' THEN
    valid := true;
  ELSIF OLD.status = 'active' AND NEW.status = 'analyzing' THEN
    valid := true;
  ELSIF OLD.status = 'analyzing' AND NEW.status IN ('active', 'resolving') THEN
    valid := true;
  ELSIF OLD.status = 'resolving' AND NEW.status IN ('complete', 'analyzing') THEN
    valid := true;
  END IF;

  IF NOT valid THEN
    RAISE EXCEPTION 'Invalid alignment status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;
```

3. In `route.ts`, add constants near the schema definitions:

```ts
const ANALYSIS_LOCK_STALE_AFTER_MS = 5 * 60 * 1000;
const ANALYSIS_RETRY_AFTER_SECONDS = 3;
```

4. Track rollback state outside the `try` so the catch can repair only locks this request acquired:

```ts
let lockAcquired = false;
let rollbackStatus: 'active' | 'resolving' | null = null;
let rollbackAlignmentId: string | null = null;
let rollbackRound: number | null = null;
```

5. After parsing `{ alignmentId, round }`, fetch the alignment with `id,status,current_round,updated_at,title`. Reject stale callers early if `round !== alignment.current_round`:

```json
{
  "error": {
    "code": "ROUND_MISMATCH",
    "message": "Cannot analyze a non-current round.",
    "details": { "currentRound": 2, "requestedRound": 1 }
  }
}
```

Use HTTP `409`.

6. Before any lock attempt, check `alignment_analyses` for `{ alignment_id: alignmentId, round }` with `.maybeSingle()`. If it exists, return HTTP `200`:

```json
{
  "data": {
    "status": "complete",
    "inProgress": false,
    "alignmentId": "uuid",
    "round": 2,
    "analysis": {
      "alignedItems": [],
      "conflicts": [],
      "hiddenAssumptions": [],
      "gaps": [],
      "imbalances": [],
      "overall_alignment_score": 82
    }
  }
}
```

For stored rows, normalize from `details.raw_output` when present, falling back to `details`, so existing-analysis and fresh-analysis responses share this shape.

7. If `alignment.status === 'analyzing'` and no current-round analysis row exists, treat it as in-flight unless stale:

```ts
const staleCutoff = new Date(Date.now() - ANALYSIS_LOCK_STALE_AFTER_MS).toISOString();
const isStale = new Date(alignment.updated_at).getTime() < Date.now() - ANALYSIS_LOCK_STALE_AFTER_MS;
```

If not stale, return HTTP `202` with a `Retry-After: 3` header:

```json
{
  "data": {
    "status": "in_progress",
    "inProgress": true,
    "alignmentId": "uuid",
    "round": 2,
    "retryAfterSeconds": 3,
    "message": "Analysis is already in progress."
  }
}
```

8. If the `analyzing` lock is stale and no current-round analysis exists, derive the recovery status from the current round:

```ts
const recoveredStatus = alignment.current_round > 1 ? 'resolving' : 'active';
```

Then conditionally recover only the still-stale lock:

```ts
const { data: recoveredLock } = await supabase
  .from('alignments')
  .update({ status: recoveredStatus })
  .eq('id', alignmentId)
  .eq('status', 'analyzing')
  .eq('current_round', round)
  .lt('updated_at', staleCutoff)
  .select('id,status')
  .maybeSingle();
```

If `recoveredLock` is null, another request recovered or completed it first; re-check for existing analysis, then return the same HTTP `202` in-progress response if no row exists.

9. For `active` or `resolving`, acquire the lock with `.maybeSingle()` instead of `.single()` so expected contention does not become an exception:

```ts
const { data: lockResult, error: lockError } = await supabase
  .from('alignments')
  .update({ status: 'analyzing' })
  .eq('id', alignmentId)
  .eq('current_round', round)
  .in('status', ['active', 'resolving'])
  .select('id,status')
  .maybeSingle();
```

If `lockError` exists, return the normal error response. If `lockResult` is null, re-check for existing analysis and otherwise return the HTTP `202` in-progress response above. Do not return `409 ANALYSIS_IN_PROGRESS` for this path anymore.

10. Immediately after a successful lock, set:

```ts
lockAcquired = true;
rollbackStatus = effectiveStatus; // the pre-lock status: active or resolving
rollbackAlignmentId = alignmentId;
rollbackRound = round;
```

11. Run the existing response fetch, participant validation, AI call, and `saveAnalysis()` flow. If `saveAnalysis()` fails with unique-constraint code `23505`, fetch the current-round analysis and return the HTTP `200` complete response instead of surfacing a duplicate-save error. If there is no row after the duplicate error, keep the existing error path.

12. On success, keep the existing final transition to `resolving`. After that status update succeeds or is logged, set `lockAcquired = false` so the catch does not roll back a completed run.

13. In the catch block, before `createErrorResponse(error)`, roll back only this request's lock:

```ts
if (lockAcquired && rollbackAlignmentId && rollbackRound && rollbackStatus) {
  const { error: rollbackError } = await supabase
    .from('alignments')
    .update({ status: rollbackStatus })
    .eq('id', rollbackAlignmentId)
    .eq('status', 'analyzing')
    .eq('current_round', rollbackRound);

  if (rollbackError) {
    telemetry.logError({
      errorCode: 'ANALYSIS_ROLLBACK_FAILED',
      errorMessage: rollbackError.message,
      userId: undefined,
      context: { alignmentId: rollbackAlignmentId, round: rollbackRound, rollbackStatus },
    });
  }
}
```

14. Keep true invalid workflow states as `409`, but include `analyzing` in the expected contract because it is now a valid in-flight state:

```json
{
  "error": {
    "code": "INVALID_STATUS",
    "message": "Cannot analyze alignment in 'complete' status.",
    "details": {
      "currentStatus": "complete",
      "expectedStatus": "active_resolving_or_analyzing_in_progress"
    }
  }
}
```

Risk:
- Adding `analyzing -> active` broadens the state machine. Keep usage constrained to conditional rollback/recovery in `route.ts`; do not expose a generic UI action that can send users backward.
- A 5-minute stale threshold can duplicate an unusually slow AI run. The `updated_at` lock refresh plus the unique `(alignment_id, round)` analysis constraint keeps the outcome safe, but it can still spend extra tokens in rare long-running cases.
- If the migration is not applied before the route catch runs, first-round rollback will fail and the old stranded state can persist. Ship the migration first or in the same deployment before traffic hits the new catch path.

### [P0] Replace server-render analysis triggering with a polling in-progress view

Files:
- `app/alignment/[id]/analysis/page.tsx`
- `app/alignment/[id]/analysis/analysis-progress-client.tsx`

Plan:
1. In `page.tsx`, remove the server-side POST path: delete the `cookies` import, `triggerServerAnalysis()`, and `getBaseUrl()`.

2. Keep the existing server render for alignments that already have `latest_analysis`.

3. When `latest_analysis` is missing, keep the submitted-response guard. If fewer than two submitted responses exist, preserve the current redirect behavior for now. If at least two submitted responses exist, render a client progress component instead of calling the API and then throwing:

```tsx
return (
  <AnalysisProgressClient
    alignmentId={id}
    round={alignmentDetail.current_round}
    title={alignmentDetail.title || 'Alignment Analysis'}
  />
);
```

4. Create `analysis-progress-client.tsx` as a client component. It should:
- POST once on mount to `/api/alignment/analyze` with `{ alignmentId, round }`.
- Treat HTTP `200` with `data.inProgress === false` as complete and call `router.refresh()`.
- Treat HTTP `202` or `data.inProgress === true` as in progress and start polling.
- For any other non-OK response, parse `{ error }`, render an inline retry state, and do not throw.
- Poll every `retryAfterSeconds` from the response, defaulting to 3 seconds.
- Query Supabase browser-side:

```ts
const { data: analysis } = await supabase
  .from('alignment_analyses')
  .select('id')
  .eq('alignment_id', alignmentId)
  .eq('round', round)
  .maybeSingle();
```

When a row exists, call `router.refresh()` so the server page renders the finished report from `getAlignmentDetail()`.

5. Use an `AbortController`, a mounted flag, and a single interval ref so route changes do not set state or navigate after unmount. This mirrors the guard already present in `waiting-client.tsx`.

6. The progress UI should be a real page state, not an error boundary: show a spinner, "Analyzing your responses", the alignment title, and a retry button only after a real non-OK error. The retry button should call the same POST function; the API idempotency means repeated clicks either pick up the current run, recover a stale lock, or return the saved analysis.

7. Exact client handling for analyze response shapes:

```ts
type AnalyzeCompleteResponse = {
  data: {
    status: 'complete';
    inProgress: false;
    alignmentId: string;
    round: number;
    analysis: {
      alignedItems: unknown[];
      conflicts: unknown[];
      hiddenAssumptions: unknown[];
      gaps: unknown[];
      imbalances: unknown[];
      overall_alignment_score: number;
    };
  };
};

type AnalyzeInProgressResponse = {
  data: {
    status: 'in_progress';
    inProgress: true;
    alignmentId: string;
    round: number;
    retryAfterSeconds: number;
    message: string;
  };
};

type AnalyzeErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
```

Risk:
- Moving the POST to the client means analysis starts when a submitted participant lands on the page with JavaScript running. That is acceptable as the smallest robust change because this app already depends on client behavior for waiting navigation, and the retry UI gives users a recovery path.
- Browser-side polling relies on the existing `alignment_analyses` participant read policy. If that policy is tightened later, replace the direct Supabase poll with a tiny authenticated status endpoint returning `{ data: { exists: boolean } }`.

### [P1] Add focused verification for race, rollback, and stale recovery

Files:
- `app/api/alignment/analyze/route.ts`
- `app/alignment/[id]/analysis/analysis-progress-client.tsx`
- `package.json`

Plan:
1. There is no active test script beyond `lint`, `type-check`, and `build`. At minimum, verify the repair with:

```sh
npm run type-check
npm run lint
npm run build
```

2. Add route-level tests only if the implementation pass introduces a test runner. The critical cases are:
- Two concurrent POSTs for the same active/current round: one returns HTTP `200` complete after generation; the other returns HTTP `202` in progress or HTTP `200` if the row is already saved. Neither returns `409 ANALYSIS_IN_PROGRESS`.
- AI generation throws after the lock: status rolls back from `analyzing -> active` for round 1.
- AI generation throws during re-analysis: status rolls back from `analyzing -> resolving` for round 2+.
- Existing stale `analyzing` row with no current-round analysis and old `updated_at`: POST recovers to the derived prior status, reacquires the lock, and either returns HTTP `200` complete or HTTP `202` if another request won the recovery.
- Existing non-stale `analyzing` row with no analysis: POST returns HTTP `202` in-progress.
- Existing current-round analysis: POST returns HTTP `200` complete without calling the AI.

3. Manual two-browser QA:
- Put both participants in waiting, submit the second response, and let both browsers navigate to `/analysis`.
- Expected result: both see either the progress UI or the report; neither sees an error boundary.
- Kill or mock the AI call once after the status flips to `analyzing`.
- Expected result: the alignment returns to `active` on round 1 or `resolving` on round 2+, and Retry can re-trigger analysis.

Risk:
- Without a test runner, the race coverage is manual and easy to regress. The route response-shape tests are worth adding when the repo has a runner, because this is a concurrency contract more than a visual tweak.

### [P2] Move analysis initiation to the second-submit mutation later

Files:
- `app/api/alignment/[id]/submit-resolution/route.ts`
- `app/api/alignment/analyze/route.ts`
- Future queue/job file if the app adopts background jobs

Plan:
1. Do not do this in the immediate repair. The client-triggered progress page is the smallest robust change.
2. Later, when the second participant submits the final needed response, start or enqueue analysis from the mutation that observes `bothSubmitted === true`.
3. Keep `/api/alignment/analyze` idempotent even after that move. The page should remain able to start or recover analysis if the submit-side trigger fails.
4. If no background worker exists, do not fake one with a fire-and-forget request inside `submit-resolution`; that reintroduces hidden failure modes. Use a real queue/job facility or keep the client progress trigger.

Risk:
- Submit-side initiation is architecturally cleaner, but it is not smaller. Doing it now would expand the blast radius into resolution submission and job semantics when the current bug can be fixed at the analyze/page boundary.
