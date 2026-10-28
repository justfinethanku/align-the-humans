create extension if not exists "pgcrypto" with schema extensions;

create table if not exists public.alignment_agreement_snapshots (
  id uuid primary key default gen_random_uuid(),
  alignment_id uuid not null references public.alignments(id) on delete cascade,
  round int not null,
  snapshot_hash text not null check (snapshot_hash ~ '^[a-f0-9]{64}$'),
  snapshot jsonb not null,
  document_html text not null,
  document_sections jsonb not null default '[]'::jsonb,
  document_inputs jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  frozen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint alignment_agreement_snapshots_one_per_round unique (alignment_id, round),
  constraint alignment_agreement_snapshots_hash_matches_payload check (snapshot->>'hash' = snapshot_hash),
  constraint alignment_agreement_snapshots_signature_fk_unique unique (alignment_id, round, id, snapshot_hash)
);

alter table public.alignment_signatures
  add column if not exists agreement_snapshot_id uuid,
  add column if not exists agreement_snapshot_hash text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'alignment_signatures_agreement_snapshot_pair'
  ) then
    alter table public.alignment_signatures
      add constraint alignment_signatures_agreement_snapshot_pair
      check (
        (agreement_snapshot_id is null and agreement_snapshot_hash is null)
        or
        (agreement_snapshot_id is not null and agreement_snapshot_hash is not null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'alignment_signatures_agreement_snapshot_hash_format'
  ) then
    alter table public.alignment_signatures
      add constraint alignment_signatures_agreement_snapshot_hash_format
      check (agreement_snapshot_hash is null or agreement_snapshot_hash ~ '^[a-f0-9]{64}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'alignment_signatures_agreement_snapshot_hash_matches_payload'
  ) then
    alter table public.alignment_signatures
      add constraint alignment_signatures_agreement_snapshot_hash_matches_payload
      check (
        agreement_snapshot_hash is null
        or nullif(canonical_snapshot->>'hash', '') = agreement_snapshot_hash
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'alignment_signatures_agreement_snapshot_fk'
  ) then
    alter table public.alignment_signatures
      add constraint alignment_signatures_agreement_snapshot_fk
      foreign key (alignment_id, round, agreement_snapshot_id, agreement_snapshot_hash)
      references public.alignment_agreement_snapshots(alignment_id, round, id, snapshot_hash)
      on delete restrict;
  end if;
end $$;

create index if not exists idx_alignment_agreement_snapshots_alignment_round
  on public.alignment_agreement_snapshots(alignment_id, round);

create index if not exists idx_alignment_agreement_snapshots_hash
  on public.alignment_agreement_snapshots(snapshot_hash);

create index if not exists idx_alignment_signatures_alignment_round_snapshot
  on public.alignment_signatures(alignment_id, round, agreement_snapshot_hash);

alter table public.alignment_agreement_snapshots enable row level security;

grant select, insert on public.alignment_agreement_snapshots to authenticated;

drop policy if exists "agreement_snapshots_read_participants"
  on public.alignment_agreement_snapshots;

create policy "agreement_snapshots_read_participants"
on public.alignment_agreement_snapshots
for select to authenticated
using (
  exists (
    select 1
    from public.alignment_participants ap
    where ap.alignment_id = alignment_agreement_snapshots.alignment_id
      and ap.user_id = (select auth.uid())
  )
);

drop policy if exists "agreement_snapshots_insert_participants"
  on public.alignment_agreement_snapshots;

create policy "agreement_snapshots_insert_participants"
on public.alignment_agreement_snapshots
for insert to authenticated
with check (
  exists (
    select 1
    from public.alignment_participants ap
    where ap.alignment_id = alignment_agreement_snapshots.alignment_id
      and ap.user_id = (select auth.uid())
  )
);

create or replace function public.block_alignment_agreement_snapshot_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Agreement snapshots are immutable once created'
    using errcode = '55000';
end;
$$;

drop trigger if exists trg_block_alignment_agreement_snapshot_update
  on public.alignment_agreement_snapshots;

create trigger trg_block_alignment_agreement_snapshot_update
before update on public.alignment_agreement_snapshots
for each row
execute function public.block_alignment_agreement_snapshot_mutation();

drop trigger if exists trg_block_alignment_agreement_snapshot_delete
  on public.alignment_agreement_snapshots;

create trigger trg_block_alignment_agreement_snapshot_delete
before delete on public.alignment_agreement_snapshots
for each row
execute function public.block_alignment_agreement_snapshot_mutation();
