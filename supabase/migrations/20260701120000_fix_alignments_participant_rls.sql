-- Restore participant (and add admin) access to public.alignments without
-- reintroducing the mutual-recursion bug that 20251111012029 worked around.
--
-- BACKGROUND:
-- 20251111012029_fix_mutual_recursion_alignments.sql dropped the original
-- participant-aware SELECT/UPDATE policies on public.alignments
-- (alignments_read_participants / alignments_update_participants) because
-- they queried alignment_participants directly inside an RLS policy, and
-- alignment_participants' own policies queried alignments back -- a mutual
-- recursion loop between the two tables' RLS. The blunt fix replaced those
-- policies with creator-only checks (created_by = auth.uid()), which
-- "fixed" the recursion but as a side effect locked every invited partner
-- (a row in alignment_participants that is NOT alignments.created_by) out
-- of the alignments table entirely -- they get 0 rows back from any
-- `select * from alignments` under the RLS-bound client, which breaks
-- getUserAlignments(), getAlignmentDetail(), the analyze route, the
-- submit-resolution route, and the resolution page for every non-creator
-- participant.
--
-- FIX: instead of embedding a cross-table EXISTS(...) subquery directly in
-- the alignments policy (which is what caused the recursion, because
-- Postgres evaluates alignment_participants' own RLS policies while
-- planning that subquery, and those in turn could reference alignments),
-- we wrap the cross-table check in a SECURITY DEFINER SQL function.
-- SECURITY DEFINER functions run with the privileges of the function
-- owner and BYPASS RLS on the tables they query internally, so
-- is_alignment_participant() reads alignment_participants without
-- triggering alignment_participants' RLS policies at all, and therefore
-- can never recurse back into alignments. Same reasoning for
-- is_platform_admin() reading public.profiles.
--
-- This migration is idempotent: every object is created with
-- CREATE OR REPLACE / DROP POLICY IF EXISTS + CREATE POLICY, so it is safe
-- to re-run.

-- =========================================================
-- 1) Helper: is the current auth.uid() a participant on this alignment?
-- =========================================================
create or replace function public.is_alignment_participant(aid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.alignment_participants ap
    where ap.alignment_id = aid
      and ap.user_id = auth.uid()
  );
$$;

grant execute on function public.is_alignment_participant(uuid) to authenticated;

-- =========================================================
-- 2) Helper: is the current auth.uid() a platform admin?
-- =========================================================
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- =========================================================
-- 3) alignments: restore participant read/update access, add admin access
--    Neither helper above queries public.alignments, so there is no path
--    back into this table's own RLS evaluation -- no recursion.
-- =========================================================
drop policy if exists "alignments_read_creator" on public.alignments;
create policy "alignments_read_creator" on public.alignments
for select to authenticated
using (
  created_by = (select auth.uid())
  or public.is_alignment_participant(id)
  or (select public.is_platform_admin())
);

drop policy if exists "alignments_update_creator" on public.alignments;
create policy "alignments_update_creator" on public.alignments
for update to authenticated
using (
  created_by = (select auth.uid())
  or public.is_alignment_participant(id)
  or (select public.is_platform_admin())
)
with check (
  created_by = (select auth.uid())
  or public.is_alignment_participant(id)
);

-- =========================================================
-- 4) Admin read-all coverage for the admin dashboard.
--    Additive SELECT policies (Postgres OR's multiple permissive policies
--    together for the same command), so existing per-user/participant
--    privacy is unaffected for non-admins -- this only ever *adds*
--    visibility for is_platform_admin() = true, never removes it.
--    public.alignments already gets admin coverage from step 3's
--    alignments_read_creator policy above, so it is intentionally skipped
--    here to avoid a redundant policy.
-- =========================================================
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles
for select to authenticated
using ((select public.is_platform_admin()));

drop policy if exists "alignment_participants_admin_read" on public.alignment_participants;
create policy "alignment_participants_admin_read" on public.alignment_participants
for select to authenticated
using ((select public.is_platform_admin()));

drop policy if exists "alignment_responses_admin_read" on public.alignment_responses;
create policy "alignment_responses_admin_read" on public.alignment_responses
for select to authenticated
using ((select public.is_platform_admin()));

drop policy if exists "alignment_analyses_admin_read" on public.alignment_analyses;
create policy "alignment_analyses_admin_read" on public.alignment_analyses
for select to authenticated
using ((select public.is_platform_admin()));

-- Done.
