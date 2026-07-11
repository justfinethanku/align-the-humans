-- Journey pass-3 integrity fixes (2026-07-11)
-- 1) Complete an alignment only after every participant has signed the same
--    frozen snapshot, using an RLS-independent participant/signature check.
-- 2) Freeze questionnaire answers after submission while preserving the
--    dedicated next-round rows used by the resolution workflow.
-- 3) Create an alignment and its owner participant row atomically.

-- ============ 1) Atomic signature completion ============

create or replace function public.complete_alignment_if_all_signed(
  p_alignment_id uuid,
  p_round integer,
  p_content_hash text
)
returns table (
  all_signed boolean,
  did_complete boolean,
  alignment_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_alignment public.alignments%rowtype;
  v_participant_count integer;
  v_matching_signature_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_round < 1 or p_content_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid signature completion arguments' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.alignment_participants ap
    where ap.alignment_id = p_alignment_id
      and ap.user_id = auth.uid()
  ) then
    raise exception 'Alignment access denied' using errcode = '42501';
  end if;

  select a.*
  into v_alignment
  from public.alignments a
  where a.id = p_alignment_id
  for update;

  if not found then
    raise exception 'Alignment not found' using errcode = 'P0002';
  end if;

  if v_alignment.current_round <> p_round then
    raise exception 'Signature round does not match current alignment round'
      using errcode = '22023';
  end if;

  select count(*)
  into v_participant_count
  from public.alignment_participants ap
  where ap.alignment_id = p_alignment_id;

  if v_participant_count < 2 then
    raise exception 'At least two participants are required to complete an alignment'
      using errcode = '23514';
  end if;

  select count(distinct s.user_id)
  into v_matching_signature_count
  from public.alignment_signatures s
  join public.alignment_participants ap
    on ap.alignment_id = s.alignment_id
   and ap.user_id = s.user_id
  where s.alignment_id = p_alignment_id
    and s.round = p_round
    and s.agreement_snapshot_hash = p_content_hash;

  all_signed := v_matching_signature_count = v_participant_count;
  did_complete := false;

  if all_signed and v_alignment.status = 'resolving' then
    update public.alignments
    set status = 'complete'
    where id = p_alignment_id;

    v_alignment.status := 'complete';
    did_complete := true;
  end if;

  alignment_status := v_alignment.status;
  return next;
end;
$$;

revoke all on function public.complete_alignment_if_all_signed(uuid, integer, text) from public, anon;
grant execute on function public.complete_alignment_if_all_signed(uuid, integer, text) to authenticated;

-- ============ 2) Submitted questionnaire immutability ============

create or replace function public.prevent_submitted_questionnaire_answer_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.submitted_at is not null
    and (
      new.answers is distinct from old.answers
      or new.metadata is distinct from old.metadata
    )
    and coalesce(old.metadata->>'resolution_submission', 'false') <> 'true'
  then
    raise exception 'Submitted questionnaire answers cannot be changed'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_submitted_questionnaire_answer_changes
  on public.alignment_responses;
create trigger trg_prevent_submitted_questionnaire_answer_changes
  before update of answers, metadata on public.alignment_responses
  for each row execute function public.prevent_submitted_questionnaire_answer_changes();

-- ============ 3) Atomic alignment creation ============

create or replace function public.create_alignment_with_owner(
  p_title text
)
returns public.alignments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_alignment public.alignments%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if nullif(btrim(p_title), '') is null then
    raise exception 'Alignment title is required' using errcode = '22023';
  end if;

  insert into public.alignments (partner_id, title, status, created_by)
  values (null, btrim(p_title), 'draft', v_user_id)
  returning * into v_alignment;

  insert into public.alignment_participants (alignment_id, user_id, role)
  values (v_alignment.id, v_user_id, 'owner');

  return v_alignment;
end;
$$;

revoke all on function public.create_alignment_with_owner(text) from public, anon;
grant execute on function public.create_alignment_with_owner(text) to authenticated;
