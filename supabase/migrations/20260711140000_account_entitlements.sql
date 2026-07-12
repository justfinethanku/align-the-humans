-- Monetization gate and participant-enrollment tightening (2026-07-11)
-- Creator activations are claimed transactionally when a draft first generates
-- questions. Invited participants never consume their own entitlement.

create table public.account_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  free_alignment_claimed_at timestamptz,
  free_alignment_id uuid references public.alignments(id) on delete set null,
  paid_alignment_credits integer not null default 0 check (paid_alignment_credits >= 0),
  comped_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    free_alignment_claimed_at is not null
    or free_alignment_id is null
  )
);

alter table public.account_entitlements enable row level security;

revoke all on table public.account_entitlements from public, anon, authenticated;
grant select on table public.account_entitlements to authenticated;

create policy account_entitlements_select_own
  on public.account_entitlements
  for select to authenticated
  using (user_id = (select auth.uid()));

create trigger account_entitlements_set_updated_at
  before update on public.account_entitlements
  for each row execute function public.set_updated_at();

-- A durable activation ledger makes retries idempotent for every access source,
-- including plan and comp access where free_alignment_id is not populated.
create table public.alignment_activation_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  alignment_id uuid not null references public.alignments(id) on delete cascade,
  claim_source text not null check (claim_source in ('free', 'paid_credit', 'plan', 'comped')),
  created_at timestamptz not null default now(),
  primary key (user_id, alignment_id)
);

alter table public.alignment_activation_claims enable row level security;
revoke all on table public.alignment_activation_claims from public, anon, authenticated;

create table public.upgrade_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null check (tier in ('alignment_pass', 'pro', 'team')),
  context text not null default 'unknown',
  created_at timestamptz not null default now()
);

create index upgrade_interest_user_created_idx
  on public.upgrade_interest (user_id, created_at desc);

alter table public.upgrade_interest enable row level security;

revoke all on table public.upgrade_interest from public, anon, authenticated;
grant insert on table public.upgrade_interest to authenticated;

create policy upgrade_interest_insert_own
  on public.upgrade_interest
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Keep profile and entitlement creation in the same auth-user trigger path.
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

  insert into public.account_entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

insert into public.account_entitlements (user_id)
select u.id
from auth.users u
on conflict (user_id) do nothing;

create or replace function public.claim_alignment_activation(p_alignment_id uuid)
returns table (allowed boolean, reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_entitlement public.account_entitlements%rowtype;
  v_claim_source text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.alignments a
    where a.id = p_alignment_id
      and a.created_by = v_user_id
  ) then
    raise exception 'Only the creator can claim alignment activation'
      using errcode = '42501';
  end if;

  insert into public.account_entitlements (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select *
  into v_entitlement
  from public.account_entitlements
  where user_id = v_user_id
  for update;

  if v_entitlement.free_alignment_id = p_alignment_id
    or exists (
      select 1
      from public.alignment_activation_claims c
      where c.user_id = v_user_id
        and c.alignment_id = p_alignment_id
    ) then
    return query select true, 'already_claimed'::text;
    return;
  end if;

  if not exists (
    select 1
    from public.alignments a
    where a.id = p_alignment_id
      and a.status = 'draft'
  ) then
    raise exception 'Only a draft alignment can be activated'
      using errcode = '55000';
  end if;

  if v_entitlement.plan in ('pro', 'team') then
    v_claim_source := 'plan';
  elsif v_entitlement.comped_until > now() then
    v_claim_source := 'comped';
  elsif v_entitlement.free_alignment_claimed_at is null then
    update public.account_entitlements
    set free_alignment_claimed_at = now(),
        free_alignment_id = p_alignment_id
    where user_id = v_user_id;
    v_claim_source := 'free';
  elsif v_entitlement.paid_alignment_credits > 0 then
    update public.account_entitlements
    set paid_alignment_credits = paid_alignment_credits - 1
    where user_id = v_user_id;
    v_claim_source := 'paid_credit';
  else
    return query select false, 'free_limit_reached'::text;
    return;
  end if;

  insert into public.alignment_activation_claims (user_id, alignment_id, claim_source)
  values (v_user_id, p_alignment_id, v_claim_source)
  on conflict (user_id, alignment_id) do nothing;

  return query select true, (v_claim_source || '_access')::text;
end;
$$;

revoke all on function public.claim_alignment_activation(uuid) from public, anon;
grant execute on function public.claim_alignment_activation(uuid) to authenticated;

-- A creator may only create their own owner membership. Partner membership is
-- created exclusively by the SECURITY DEFINER invite-redemption RPC.
drop policy if exists participants_insert_creator on public.alignment_participants;
drop policy if exists "participants_insert_creator" on public.alignment_participants;
create policy participants_insert_creator
  on public.alignment_participants
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1
      from public.alignments a
      where a.id = alignment_participants.alignment_id
        and a.created_by = (select auth.uid())
    )
  );
