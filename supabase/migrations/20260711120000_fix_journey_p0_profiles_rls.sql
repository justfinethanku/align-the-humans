-- Journey pass-3 P0 fixes (2026-07-11)
-- 1) profiles were never created for new users (signup upsert has no INSERT policy
--    and no auth trigger existed) -> invite generation FK-fails for every new user.
-- 2) responses_read_after_both_submitted policy subqueried alignment_responses from
--    within its own policy -> 42P17 infinite recursion on EVERY insert/select,
--    so answers could never be saved.
-- 3) invited partners could only see their own participant row -> resolution page
--    redirected them out; sign completion counted 1 participant.
-- 4) no FK alignment_participants.user_id -> profiles, so the PostgREST embed
--    profiles:user_id(display_name) 400s (PGRST200); and no RLS path allowed
--    reading a partner's profile row at all.

-- ============ 1) profiles: auto-create + backfill + policies ============

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill every existing auth user missing a profile
insert into public.profiles (id, display_name)
select u.id, coalesce(nullif(u.raw_user_meta_data->>'display_name', ''), split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Let the signup client upsert its own profile row (display_name edits etc.)
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- Participants of a shared alignment may read each other's profile
create or replace function public.shares_alignment_with(other_user uuid)
returns boolean
language sql stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.alignment_participants me
    join public.alignment_participants them
      on them.alignment_id = me.alignment_id
    where me.user_id = auth.uid()
      and them.user_id = other_user
  );
$$;

revoke all on function public.shares_alignment_with(uuid) from public;
grant execute on function public.shares_alignment_with(uuid) to authenticated;

drop policy if exists profiles_read_shared on public.profiles;
create policy profiles_read_shared on public.profiles
  for select to authenticated
  using (shares_alignment_with(id));

-- ============ 2) alignment_responses: kill the recursive policy ============

-- Caller-aware: true only when the CALLER has a submitted response for this round
-- AND someone else does too (preserves the original disclosure semantics; the old
-- policy expressed this with self-subqueries, which is what recursed).
create or replace function public.both_responses_submitted(p_alignment_id uuid, p_round integer)
returns boolean
language sql stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.is_alignment_participant(p_alignment_id)
    and exists (
      select 1
      from public.alignment_responses self_response
      where self_response.alignment_id = p_alignment_id
        and self_response.round = p_round
        and self_response.user_id = auth.uid()
        and self_response.submitted_at is not null
    )
    and exists (
      select 1
      from public.alignment_responses other_response
      where other_response.alignment_id = p_alignment_id
        and other_response.round = p_round
        and other_response.user_id <> auth.uid()
        and other_response.submitted_at is not null
    );
$$;

revoke all on function public.both_responses_submitted(uuid, integer) from public;
grant execute on function public.both_responses_submitted(uuid, integer) to authenticated;

drop policy if exists responses_read_after_both_submitted on public.alignment_responses;
create policy responses_read_after_both_submitted on public.alignment_responses
  for select to authenticated
  using (
    submitted_at is not null
    and is_alignment_participant(alignment_id)
    and both_responses_submitted(alignment_id, round)
  );

-- Response writers must actually be participants (was: any signed-in user could
-- insert rows under their own id into any alignment they knew the UUID of).
drop policy if exists responses_insert_own on public.alignment_responses;
create policy responses_insert_own on public.alignment_responses
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_alignment_participant(alignment_id)
  );

drop policy if exists responses_update_own on public.alignment_responses;
create policy responses_update_own on public.alignment_responses
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_alignment_participant(alignment_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.is_alignment_participant(alignment_id)
  );

-- ============ 3) alignment_participants: members see all rows ============

revoke all on function public.is_alignment_participant(uuid) from public;
grant execute on function public.is_alignment_participant(uuid) to authenticated;

drop policy if exists participants_read_participants on public.alignment_participants;
drop policy if exists participants_read_members on public.alignment_participants;
create policy participants_read_members on public.alignment_participants
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or is_alignment_participant(alignment_id)
  );

-- NOTE (follow-up migration required): participants_insert_creator still allows a
-- creator to enroll an arbitrary user_id without acceptance. Tightening it to
-- owner-row-only requires ClarityForm.ensurePartnerParticipant to stop direct
-- pre-enrollment (invite redemption RPC already covers partner entry). Tracked for
-- the next migration in this pass so the code change lands atomically with it.

-- ============ 4) FK so PostgREST can embed profiles:user_id ============

alter table public.alignment_participants
  drop constraint if exists alignment_participants_user_id_profiles_fkey;
alter table public.alignment_participants
  add constraint alignment_participants_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
