-- =========================================
-- Human Alignment: Core Schema + RLS + Realtime
-- =========================================

-- 0) Prereqs
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- 1) Core tables

-- profiles: 1-1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- partners: represents a partnership (two users). You can expand later to >2 if needed.
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- alignments: a workflow instance for a partner pair
create table if not exists public.alignments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  status text not null check (status in ('draft','active','analyzing','resolving','complete')),
  current_round int not null default 1,
  title text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- alignment_participants: links users to an alignment
create table if not exists public.alignment_participants (
  id uuid primary key default gen_random_uuid(),
  alignment_id uuid not null references public.alignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','partner')),
  created_at timestamptz not null default now(),
  unique (alignment_id, user_id)
);

-- templates: reusable sets of questions with JSONB payload
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version int not null default 1,
  schema jsonb,                -- optional JSON Schema
  content jsonb not null,      -- question list and structure
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- alignment_responses: per-user responses per round
create table if not exists public.alignment_responses (
  id uuid primary key default gen_random_uuid(),
  alignment_id uuid not null references public.alignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  round int not null,
  response_version int not null default 1,
  answers jsonb not null default '{}'::jsonb,
  metadata jsonb,
  submitted_at timestamptz,             -- set when user finalizes their round
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (alignment_id, user_id, round)
);

-- alignment_analyses: AI output per alignment per round
create table if not exists public.alignment_analyses (
  id uuid primary key default gen_random_uuid(),
  alignment_id uuid not null references public.alignments(id) on delete cascade,
  round int not null,
  summary jsonb,      -- compact summary used by UI
  details jsonb,      -- full model output or diffs
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (alignment_id, round)
);

-- alignment_signatures: used to lock/attest snapshots
create table if not exists public.alignment_signatures (
  id uuid primary key default gen_random_uuid(),
  alignment_id uuid not null references public.alignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  round int not null,
  canonical_snapshot jsonb not null,  -- frozen copy of answers/content signed
  signature text not null,            -- e.g., hash or cryptographic sig
  created_at timestamptz not null default now(),
  unique (alignment_id, user_id, round)
);

-- 2) Helpful updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_partners_updated_at on public.partners;
create trigger trg_partners_updated_at before update on public.partners
for each row execute function public.set_updated_at();

drop trigger if exists trg_alignments_updated_at on public.alignments;
create trigger trg_alignments_updated_at before update on public.alignments
for each row execute function public.set_updated_at();

drop trigger if exists trg_templates_updated_at on public.templates;
create trigger trg_templates_updated_at before update on public.templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_alignment_responses_updated_at on public.alignment_responses;
create trigger trg_alignment_responses_updated_at before update on public.alignment_responses
for each row execute function public.set_updated_at();

-- 3) Enable RLS
alter table public.profiles enable row level security;
alter table public.partners enable row level security;
alter table public.alignments enable row level security;
alter table public.alignment_participants enable row level security;
alter table public.templates enable row level security;
alter table public.alignment_responses enable row level security;
alter table public.alignment_analyses enable row level security;
alter table public.alignment_signatures enable row level security;

-- 4) Base grants (limit to authenticated app users)
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.partners to authenticated;
grant select, insert, update on public.alignments to authenticated;
grant select, insert, update on public.alignment_participants to authenticated;
grant select, insert, update on public.templates to authenticated;
grant select, insert, update on public.alignment_responses to authenticated;
grant select, insert on public.alignment_analyses to authenticated;
grant select, insert on public.alignment_signatures to authenticated;

-- 5) RLS policies

-- profiles: user can read/update own profile
drop policy if exists "own_profile_read" on public.profiles;
create policy "own_profile_read" on public.profiles
for select to authenticated
using (id = (select auth.uid()));

drop policy if exists "own_profile_write" on public.profiles;
create policy "own_profile_write" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- partners: creator and members can read; creator can update
-- A lightweight policy: any member appears in alignment_participants via alignments.partners
drop policy if exists "partners_read_members" on public.partners;
create policy "partners_read_members" on public.partners
for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1
    from public.alignments a
    join public.alignment_participants ap on ap.alignment_id = a.id
    where a.partner_id = partners.id
      and ap.user_id = (select auth.uid())
  )
);

drop policy if exists "partners_insert_creator" on public.partners;
create policy "partners_insert_creator" on public.partners
for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "partners_update_creator" on public.partners;
create policy "partners_update_creator" on public.partners
for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

-- alignments: participants can read; creator/participants can insert with self as creator; updates only by participants
drop policy if exists "alignments_read_participants" on public.alignments;
create policy "alignments_read_participants" on public.alignments
for select to authenticated
using (
  exists (
    select 1 from public.alignment_participants ap
    where ap.alignment_id = alignments.id
      and ap.user_id = (select auth.uid())
  )
);

drop policy if exists "alignments_insert_creator" on public.alignments;
create policy "alignments_insert_creator" on public.alignments
for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "alignments_update_participants" on public.alignments;
create policy "alignments_update_participants" on public.alignments
for update to authenticated
using (
  exists (
    select 1 from public.alignment_participants ap
    where ap.alignment_id = alignments.id
      and ap.user_id = (select auth.uid())
  )
)
with check (exists (
  select 1 from public.alignment_participants ap
  where ap.alignment_id = alignments.id
    and ap.user_id = (select auth.uid())
));

-- alignment_participants: participants can read their alignment; insert restricted to creator
drop policy if exists "participants_read_participants" on public.alignment_participants;
create policy "participants_read_participants" on public.alignment_participants
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.alignment_participants ap2
    where ap2.alignment_id = alignment_participants.alignment_id
      and ap2.user_id = (select auth.uid())
  )
);

drop policy if exists "participants_insert_creator" on public.alignment_participants;
create policy "participants_insert_creator" on public.alignment_participants
for insert to authenticated
with check (
  exists (
    select 1 from public.alignments a
    where a.id = alignment_participants.alignment_id
      and a.created_by = (select auth.uid())
  )
);

-- templates: read all, write only creator
drop policy if exists "templates_read_all" on public.templates;
create policy "templates_read_all" on public.templates
for select to authenticated
using (true);

drop policy if exists "templates_insert_creator" on public.templates;
create policy "templates_insert_creator" on public.templates
for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "templates_update_creator" on public.templates;
create policy "templates_update_creator" on public.templates
for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

-- alignment_responses:
-- 1) users can read their own responses anytime
drop policy if exists "responses_read_own" on public.alignment_responses;
create policy "responses_read_own" on public.alignment_responses
for select to authenticated
using (user_id = (select auth.uid()));

-- 2) participants can read partner responses ONLY if both submitted for that round
drop policy if exists "responses_read_after_both_submitted" on public.alignment_responses;
create policy "responses_read_after_both_submitted" on public.alignment_responses
for select to authenticated
using (
  exists (
    select 1 from public.alignment_participants ap
    where ap.alignment_id = alignment_responses.alignment_id
      and ap.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.alignment_responses r_self
    where r_self.alignment_id = alignment_responses.alignment_id
      and r_self.round = alignment_responses.round
      and r_self.user_id = (select auth.uid())
      and r_self.submitted_at is not null
  )
  and exists (
    select 1 from public.alignment_responses r_other
    where r_other.alignment_id = alignment_responses.alignment_id
      and r_other.round = alignment_responses.round
      and r_other.user_id <> (select auth.uid())
      and r_other.submitted_at is not null
  )
);

-- 3) users can insert/update only their own responses
drop policy if exists "responses_insert_own" on public.alignment_responses;
create policy "responses_insert_own" on public.alignment_responses
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "responses_update_own" on public.alignment_responses;
create policy "responses_update_own" on public.alignment_responses
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- alignment_analyses: participants read; inserts typically done by privileged function, but allow authenticated if participant
drop policy if exists "analyses_read_participants" on public.alignment_analyses;
create policy "analyses_read_participants" on public.alignment_analyses
for select to authenticated
using (
  exists (
    select 1 from public.alignment_participants ap
    where ap.alignment_id = alignment_analyses.alignment_id
      and ap.user_id = (select auth.uid())
  )
);

drop policy if exists "analyses_insert_participants" on public.alignment_analyses;
create policy "analyses_insert_participants" on public.alignment_analyses
for insert to authenticated
with check (
  exists (
    select 1 from public.alignment_participants ap
    where ap.alignment_id = alignment_analyses.alignment_id
      and ap.user_id = (select auth.uid())
  )
);

-- alignment_signatures: participants can read; insert only own signature
drop policy if exists "signatures_read_participants" on public.alignment_signatures;
create policy "signatures_read_participants" on public.alignment_signatures
for select to authenticated
using (
  exists (
    select 1 from public.alignment_participants ap
    where ap.alignment_id = alignment_signatures.alignment_id
      and ap.user_id = (select auth.uid())
  )
);

drop policy if exists "signatures_insert_own" on public.alignment_signatures;
create policy "signatures_insert_own" on public.alignment_signatures
for insert to authenticated
with check (user_id = (select auth.uid()));

-- 6) Indexes

-- Foreign keys and lookups
create index if not exists idx_alignments_partner on public.alignments(partner_id);
create index if not exists idx_alignments_status_round on public.alignments(status, current_round);
create index if not exists idx_alignment_participants_user_alignment on public.alignment_participants(user_id, alignment_id);
create index if not exists idx_alignment_responses_alignment_user_round on public.alignment_responses(alignment_id, user_id, round);
create index if not exists idx_alignment_responses_submitted_at on public.alignment_responses(submitted_at);
create index if not exists idx_alignment_analyses_alignment_round on public.alignment_analyses(alignment_id, round);
create index if not exists idx_alignment_signatures_alignment_user on public.alignment_signatures(alignment_id, user_id);

-- JSONB GIN for response queries
create index if not exists idx_alignment_responses_answers_gin on public.alignment_responses using gin (answers jsonb_path_ops);

-- 7) Realtime broadcasting on alignment_responses

-- SECURITY DEFINER function to broadcast row changes to a private topic per alignment
create or replace function public.alignment_responses_broadcast_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
  perform realtime.broadcast_changes(
    'alignment:' || coalesce(new.alignment_id, old.alignment_id)::text || ':responses',
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$$;

-- Ensure only postgres (owner) executes function directly
revoke all on function public.alignment_responses_broadcast_trigger() from anon, authenticated;

drop trigger if exists trg_alignment_responses_broadcast on public.alignment_responses;
create trigger trg_alignment_responses_broadcast
after insert or update or delete on public.alignment_responses
for each row execute function public.alignment_responses_broadcast_trigger();

-- 8) Optional: simple state transition guard
-- Prevent illegal transitions: draft -> active -> analyzing -> resolving -> complete
create or replace function public.validate_alignment_transition()
returns trigger
language plpgsql
as $$
declare
  valid boolean := false;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  -- Allowed edges
  if old.status = 'draft' and new.status in ('active') then valid := true; end if;
  if old.status = 'active' and new.status in ('analyzing') then valid := true; end if;
  if old.status = 'analyzing' and new.status in ('resolving') then valid := true; end if;
  if old.status = 'resolving' and new.status in ('complete') then valid := true; end if;

  if not valid then
    raise exception 'Invalid alignment status transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_alignments_validate_transition on public.alignments;
create trigger trg_alignments_validate_transition
before update on public.alignments
for each row execute function public.validate_alignment_transition();

-- Done.
