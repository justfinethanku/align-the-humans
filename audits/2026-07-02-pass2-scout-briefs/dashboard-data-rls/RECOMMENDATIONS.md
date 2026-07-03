# dashboard-data-rls scout

## Current state

Repo verified read-only at `/Users/jonathanedwards/AUTOMATION/Jons 2025 AI Apps/Human Alignment`, on `main` at `6d59076 Add .fleet-agent: this repo's fleet agent identity is 'accord'`. The repo worktree has no diff from this scout.

The two prior dashboard flicker fixes are already on main. `app/dashboard/DashboardClient.tsx` now wraps the realtime refetch in `React.useCallback`, and `app/lib/hooks/useAlignmentUpdates.ts` stores event callbacks in a ref so the subscription effect depends only on `enabled`, `alignmentId`, and `disconnect`. `app/lib/hooks/useDashboardData.ts` also no longer calls `setLoading(true)` during `fetchAlignments`, so realtime alignment refetches keep rendered cards on screen.

Still open: `app/dashboard/page.tsx` fetches only auth and `profiles`, then renders `DashboardClient` without alignments or partners. `DashboardClient` still calls `useDashboardData()` and `usePartners()` with no initial data. `useDashboardData` starts with `loading: true`; `usePartners` starts with `loading: true` and still calls `setLoading(true)` on every fetch. That is the remaining route skeleton to in-page spinner path.

Still open: `useDashboardData.ts` still assigns `ui_status: alignment.status as UIStatus`. `components/dashboard/AlignmentCard.tsx` and `StatusBadge.tsx` already know how to render `aligned_awaiting_signatures`, but the hook never supplies that state. The old `alignment_status_view` contains a loose recency-based `aligned_awaiting_signatures` rule and is no longer used by the dashboard hook.

Still open: the initial migration policy `responses_read_after_both_submitted` on `public.alignment_responses` lets a participant select the partner row, including `answers`, once both participants have `submitted_at` for the round. Later migrations add admin read coverage but do not tighten participant response visibility. `getAlignmentDetail()` fetches `partner_response` with `select('*')` and only `submitted_at is not null`. I found no component that intentionally renders partner answer JSON before analysis, but the database policy and broad helper query make those answers selectable before analysis completes.

Current response-row callers that must be accounted for when RLS tightens: `waiting/page.tsx` derives `initialPartnerSubmitted` from `alignment.partner_response`; `waiting/waiting-client.tsx` polls `alignment_responses` for submitted rows; `analysis/page.tsx` counts submitted rows before triggering analysis; `resolution/page.tsx` reads next-round resolution response metadata; `submit-resolution/route.ts` calls `getRoundResponses()` only to decide `bothSubmitted`; `analyze/route.ts` calls `getRoundResponses()` to fetch raw answers for the backend AI job; `sign/route.ts` reads full responses into the canonical signature snapshot.

## Recommendations

### P0 Tighten response RLS and replace pre-analysis response-row status checks

Files:
`supabase/migrations/20260703120000_tighten_alignment_response_visibility.sql`, `app/lib/database.types.ts`, `app/lib/types.ts`, `app/lib/db-helpers.ts`, `app/alignment/[id]/waiting/page.tsx`, `app/alignment/[id]/waiting/waiting-client.tsx`, `app/alignment/[id]/analysis/page.tsx`, `app/api/alignment/analyze/route.ts`, `app/api/alignment/[id]/submit-resolution/route.ts`, `app/alignment/[id]/resolution/page.tsx`, `app/api/alignment/[id]/sign/route.ts`.

Plan:
1. Add a forward migration. Do not edit `20251110051815_init_human_alignment.sql`. Keep `responses_read_own`, `responses_insert_own`, `responses_update_own`, and `alignment_responses_admin_read`; replace only the partner-read policy. Use `SECURITY DEFINER` helpers because a direct self-query of `alignment_responses` inside an `alignment_responses` RLS policy can recurse.

```sql
-- supabase/migrations/20260703120000_tighten_alignment_response_visibility.sql

create or replace function public.get_alignment_submission_status(
  aid uuid,
  response_round integer,
  resolution_for_round integer default null
)
returns table (
  participant_count integer,
  submitted_count integer,
  user_submitted boolean,
  partner_submitted boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with caller as (
    select auth.uid() as uid
  ),
  participant_check as (
    select exists (
      select 1
      from public.alignment_participants ap
      where ap.alignment_id = aid
        and ap.user_id = (select uid from caller)
    ) as allowed
  ),
  participant_counts as (
    select count(*)::integer as participant_count
    from public.alignment_participants ap
    where ap.alignment_id = aid
  ),
  submitted as (
    select r.user_id
    from public.alignment_responses r
    where r.alignment_id = aid
      and r.round = response_round
      and r.submitted_at is not null
      and (
        resolution_for_round is null
        or (
          r.metadata ->> 'resolution_submission' = 'true'
          and r.metadata ->> 'resolution_round' = resolution_for_round::text
        )
      )
  )
  select
    pc.participant_count,
    count(s.user_id)::integer as submitted_count,
    coalesce(bool_or(s.user_id = (select uid from caller)), false) as user_submitted,
    coalesce(bool_or(s.user_id <> (select uid from caller)), false) as partner_submitted
  from participant_counts pc
  left join submitted s on true
  where (select allowed from participant_check)
  group by pc.participant_count;
$$;

revoke all on function public.get_alignment_submission_status(uuid, integer, integer) from public;
grant execute on function public.get_alignment_submission_status(uuid, integer, integer) to authenticated;

create or replace function public.can_read_released_partner_response(
  aid uuid,
  response_round integer
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with caller as (
    select auth.uid() as uid
  ),
  participant_counts as (
    select count(*)::integer as participant_count
    from public.alignment_participants ap
    where ap.alignment_id = aid
  ),
  submitted_counts as (
    select count(*)::integer as submitted_count
    from public.alignment_responses r
    where r.alignment_id = aid
      and r.round = response_round
      and r.submitted_at is not null
  ),
  release_state as (
    select
      exists (
        select 1
        from public.alignment_analyses aa
        where aa.alignment_id = aid
          and aa.round = response_round
      ) as has_analysis,
      exists (
        select 1
        from public.alignments a
        where a.id = aid
          and a.status in ('resolving', 'complete')
          and a.current_round = response_round
          and not exists (
            select 1
            from public.alignment_responses rr
            where rr.alignment_id = aid
              and rr.round = response_round
              and rr.submitted_at is not null
              and rr.metadata ->> 'resolution_submission' = 'true'
              and not exists (
                select 1
                from public.alignment_analyses aa_resolution
                where aa_resolution.alignment_id = aid
                  and aa_resolution.round = response_round
              )
          )
      ) as status_released
  )
  select
    exists (
      select 1
      from public.alignment_participants ap
      where ap.alignment_id = aid
        and ap.user_id = (select uid from caller)
    )
    and exists (
      select 1
      from public.alignment_responses r_self
      where r_self.alignment_id = aid
        and r_self.round = response_round
        and r_self.user_id = (select uid from caller)
        and r_self.submitted_at is not null
    )
    and (
      select submitted_count
      from submitted_counts
    ) >= greatest(
      2,
      (select participant_count from participant_counts)
    )
    and (
      (select has_analysis from release_state)
      or (select status_released from release_state)
    );
$$;

revoke all on function public.can_read_released_partner_response(uuid, integer) from public;
grant execute on function public.can_read_released_partner_response(uuid, integer) to authenticated;

drop policy if exists "responses_read_after_both_submitted" on public.alignment_responses;
drop policy if exists "responses_read_after_analysis" on public.alignment_responses;

create policy "responses_read_after_analysis"
on public.alignment_responses
for select to authenticated
using (
  user_id <> (select auth.uid())
  and submitted_at is not null
  and (select public.can_read_released_partner_response(alignment_id, round))
);
```

2. Update `app/lib/database.types.ts` so Supabase RPC calls are typed:

```ts
get_alignment_submission_status: {
  Args: {
    aid: string;
    response_round: number;
    resolution_for_round?: number | null;
  };
  Returns: {
    participant_count: number;
    submitted_count: number;
    user_submitted: boolean;
    partner_submitted: boolean;
  }[];
};
can_read_released_partner_response: {
  Args: {
    aid: string;
    response_round: number;
  };
  Returns: boolean;
};
```

3. Add `partner_submission_status` to `AlignmentDetail` in `app/lib/types.ts`, and add a small helper in `db-helpers.ts`:

```ts
export interface AlignmentSubmissionStatus {
  participant_count: number;
  submitted_count: number;
  user_submitted: boolean;
  partner_submitted: boolean;
}

export async function getAlignmentSubmissionStatus(
  supabase: SupabaseClientType,
  alignmentId: string,
  responseRound: number,
  resolutionForRound?: number | null
): Promise<QueryResult<AlignmentSubmissionStatus>> {
  const { data, error } = await supabase
    .rpc('get_alignment_submission_status', {
      aid: alignmentId,
      response_round: responseRound,
      resolution_for_round: resolutionForRound ?? null,
    })
    .maybeSingle();

  return { data: data as AlignmentSubmissionStatus | null, error };
}
```

4. In `getAlignmentDetail()`, fetch `latestAnalysis` first, call `getAlignmentSubmissionStatus()` for `alignment.current_round`, and call `rpc('can_read_released_partner_response')` before querying `partner_response`. Attach `partner_response` only when that RPC returns `true`. This removes broad pre-analysis `select('*')` partner reads while preserving post-analysis answer availability.

5. Replace pre-analysis response-row status checks with the safe RPC:
   - `waiting/page.tsx`: use `alignment.partner_submission_status?.partner_submitted === true` instead of `alignment.partner_response?.submitted_at`.
   - `waiting/page.tsx` and `waiting-client.tsx`: pass `currentRound` to the client and poll `get_alignment_submission_status` instead of selecting `alignment_responses`.
   - `analysis/page.tsx`: use `getAlignmentSubmissionStatus()` for the submitted count before `triggerServerAnalysis`.
   - `resolution/page.tsx`: use `getAlignmentSubmissionStatus(alignmentId, alignment.current_round + 1, alignment.current_round)` for `hasUserSubmitted` and `hasPartnerSubmitted`, instead of selecting next-round response metadata.
   - `submit-resolution/route.ts`: replace the `getRoundResponses()` call used only for `bothSubmitted` with the same resolution-aware status helper.

6. In `analyze/route.ts`, keep the user-scoped client for authentication, participation checks, rate limiting, alignment status validation, and the status lock. After the lock moves the alignment to `analyzing`, fetch raw answer rows for the backend AI job with `createAdminClient()`:

```ts
const adminSupabase = createAdminClient();
const { data: responses, error: responsesError } = await getRoundResponses(
  adminSupabase,
  alignmentId,
  round
);
```

Do not expose any admin-backed response rows from the route. The admin client is needed because the tightened RLS intentionally hides the partner's answer while status is `analyzing` and no analysis row exists yet.

7. In `sign/route.ts`, check for a current-round `alignment_analyses` row before `generateCanonicalSnapshot()` reads full responses. If no analysis exists, return a 409. That prevents a bad `resolving` state from producing a signature snapshot with unreleased answer data.

Risk:
The direct policy shape from the original migration would recurse if extended with more `alignment_responses` self-subqueries. The `SECURITY DEFINER` helpers avoid that by running the internal response, participant, alignment, and analysis checks outside the target table's RLS evaluation path, matching the repo's existing `is_alignment_participant()` recursion fix. Keep `set search_path = public, pg_temp`, revoke from `public`, and grant only to `authenticated`. The helper returns counts and booleans only, never `answers`. The extra resolution-submission guard is necessary because this app stores resolution picks as `current_round + 1` while the alignment can still be `resolving`; status alone would otherwise release next-round answers before their analysis exists.

### P1 Hydrate dashboard alignments and partners from server data

Files:
`app/lib/dashboard-data.ts`, `app/lib/hooks/useDashboardData.ts`, `app/lib/hooks/usePartners.ts`, `app/lib/hooks/index.ts`, `app/dashboard/page.tsx`, `app/dashboard/DashboardClient.tsx`.

Plan:
1. Create `app/lib/dashboard-data.ts` as the single shared data layer for the dashboard. It must not import `next/headers`, `cookies`, `createServerClient`, or `createClient`. It should accept a Supabase client plus `userId`, and export:

```ts
export async function fetchDashboardAlignments(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<AlignmentWithStatus[]>;

export async function fetchDashboardPartners(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PartnerWithCount[]>;
```

Move the existing query bodies from `useDashboardData.fetchAlignments()` and `usePartners.fetchPartners()` into those functions. Keep the server and client refetch paths on the same helpers so the initial HTML and later realtime/manual refreshes cannot drift.

2. In `fetchDashboardAlignments()`, keep using the user-scoped Supabase client. Fetch the user's alignment IDs from `alignment_participants`, fetch the matching `alignments` with participants, then batch fetch current-round analyses and signatures for those alignment IDs. For submitted counts, use `get_alignment_submission_status` per alignment until there is a batch RPC. Do not use the service-role client for dashboard preload.

3. In `fetchDashboardPartners()`, preserve the current behavior from `usePartners`: participations, other participants, partner profiles, alignments with `partner_id`, partner records, then sort by recent activity.

4. In `app/dashboard/page.tsx`, fetch profile, initial alignments, and initial partners on the server with the user-scoped server client:

```ts
const [profileResult, initialAlignments, initialPartners] = await Promise.all([
  supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single(),
  fetchDashboardAlignments(supabase, user.id),
  fetchDashboardPartners(supabase, user.id),
]);
```

Pass `initialAlignments` and `initialPartners` into `DashboardClient`.

5. Extend `DashboardClientProps` and call:

```ts
useDashboardData({ userId, initialData: initialAlignments });
usePartners({ userId, initialData: initialPartners });
```

6. Update both hooks to accept options:

```ts
interface UseDashboardDataOptions {
  userId: string;
  initialData?: AlignmentWithStatus[];
}

interface UsePartnersOptions {
  userId: string;
  initialData?: PartnerWithCount[];
}
```

Initialize state from `initialData ?? []` and `loading` from `initialData === undefined`. Skip the mount fetch when hydrated data is present, but leave `refetch` intact for realtime alignment updates, partner-added refreshes, and manual retries. `usePartners` should match `useDashboardData`: only show blocking loading for the first empty load, not for background refetches over already-rendered data.

7. Run `npm run type-check` and `npm run build` after the server/client boundary change.

Risk:
The main risk is duplicating query logic and getting different dashboard states after hydration versus after refetch. The shared `dashboard-data.ts` module is the guardrail. The second risk is accidentally importing server-only modules into a client hook; keep the shared module parameterized by the Supabase client. Tightened response RLS will hide partner answer rows pre-analysis, so dashboard status derivation must use the safe status RPC instead of raw `alignment_responses` counts or the old `security_invoker` view.

### P1 Derive `aligned_awaiting_signatures` in the shared dashboard data layer

Files:
`app/lib/dashboard-data.ts`, `app/lib/hooks/useDashboardData.ts`, `components/dashboard/AlignmentCard.tsx`, `app/dashboard/page.tsx`, `app/alignment/[id]/document/page.tsx`, `app/api/alignment/[id]/sign/route.ts`.

Plan:
1. Derive `ui_status` in `app/lib/dashboard-data.ts`, not in `AlignmentCard`. The card should stay presentational and continue using `alignment.ui_status || alignment.status`.

2. Use one shared readiness rule for dashboard, document access, and signing:
   - status is `resolving`;
   - latest analysis for `alignment.current_round` exists;
   - `analysis.summary.conflicts` is an array with length `0`;
   - signatures are still pending, meaning `signed_count < participant_count`.

3. Add a pure helper alongside the dashboard fetcher:

```ts
type DashboardStatusInput = {
  status: AlignmentStatus;
  current_round: number;
  updated_at: string;
  participant_count: number;
  submitted_count: number;
  signed_count: number;
  latest_analysis:
    | { round: number; summary: unknown }
    | null;
};

export function hasZeroCurrentRoundConflicts(input: DashboardStatusInput): boolean {
  if (!input.latest_analysis || input.latest_analysis.round !== input.current_round) {
    return false;
  }

  const summary = input.latest_analysis.summary as { conflicts?: unknown } | null;
  return Array.isArray(summary?.conflicts) && summary.conflicts.length === 0;
}

export function deriveDashboardUiStatus(
  input: DashboardStatusInput
): AlignmentStatus | UIStatus {
  if (input.status === 'complete') return 'complete';

  const zeroConflicts = hasZeroCurrentRoundConflicts(input);
  const signaturesPending =
    input.participant_count > 0 &&
    input.signed_count < input.participant_count;

  if (input.status === 'resolving' && zeroConflicts && signaturesPending) {
    return 'aligned_awaiting_signatures';
  }

  if (input.status === 'resolving') return 'in_conflict_resolution';

  if (
    input.status === 'active' &&
    input.submitted_count > 0 &&
    input.submitted_count < input.participant_count
  ) {
    return 'waiting_partner';
  }

  if (
    input.status !== 'complete' &&
    new Date(input.updated_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000
  ) {
    return 'stalled';
  }

  return input.status;
}
```

4. Feed the helper from the shared dashboard fetch:
   - `participant_count`: count the fetched `alignment_participants`;
   - `submitted_count`: safe status RPC for the current round;
   - `signed_count`: current-round `alignment_signatures` count;
   - `latest_analysis`: current-round `alignment_analyses` row.

5. Fix the dashboard status types while touching the hook. `AlignmentWithStatus.ui_status` and `AlignmentCardProps.alignment.ui_status` should be `AlignmentStatus | UIStatus`, not only `UIStatus`, because the derivation intentionally falls back to raw database statuses such as `draft`, `active`, and `analyzing`.

6. Make `document/page.tsx` enforce the same readiness rule before rendering the signature/document surface. If status is `resolving` but there is no current-round analysis, redirect to `/analysis`. If the current-round analysis has conflicts, redirect to `/resolution`. Keep `complete` accepted. This brings the page gate in line with the dashboard state rather than relying on status alone.

7. Make `sign/route.ts` reuse the same readiness rule before inserting a signature. It should reject signing if there is no current-round analysis or if conflicts remain.

8. Do not use `alignment_status_view` for this repair. It is legacy for the dashboard path and has the wrong readiness rule. The source of truth for server preload and hook refetch should be the shared TypeScript derivation above.

Risk:
Client-only derivation would make hydration vulnerable to mismatch and stale cards. Shared data-layer derivation is the right fit because the server preload and hook refetch will use the same code. The only behavior change to call out is direct `/document` access: today it accepts any `resolving` alignment, even with conflicts. Tightening that gate is consistent with `analysis/page.tsx` and `resolution/page.tsx`, which only route zero-conflict analyses to the document/signature phase.
