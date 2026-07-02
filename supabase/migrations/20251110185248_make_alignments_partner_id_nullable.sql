-- Make partner_id nullable to support solo alignment creation
-- This allows users to start an alignment without selecting a partner first

-- Drop existing foreign key constraint
alter table public.alignments
  drop constraint if exists alignments_partner_id_fkey;

-- Make partner_id nullable
alter table public.alignments
  alter column partner_id drop not null;

-- Re-add foreign key constraint with nullable support
alter table public.alignments
  add constraint alignments_partner_id_fkey
  foreign key (partner_id) references public.partners(id) on delete cascade;

-- Add alignment_invitations table for secure invite token management
create table if not exists public.alignment_invitations (
  id uuid primary key default gen_random_uuid(),
  alignment_id uuid not null references public.alignments(id) on delete cascade,
  token_hash text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_uses int not null default 1,
  current_uses int not null default 0,
  invalidated_at timestamptz
);

-- Add current_invite_id to alignments table to track active invite
alter table public.alignments
  add column if not exists current_invite_id uuid references public.alignment_invitations(id) on delete set null;

-- Create index on token_hash for fast lookups
create index if not exists idx_alignment_invitations_token_hash
  on public.alignment_invitations(token_hash);

-- Create index on alignment_id for participant joins
create index if not exists idx_alignment_invitations_alignment_id
  on public.alignment_invitations(alignment_id);

-- Enable RLS on alignment_invitations
alter table public.alignment_invitations enable row level security;

-- RLS Policy: Users can view invitations for alignments they created
create policy "Users can view their alignment invitations"
  on public.alignment_invitations
  for select
  using (
    created_by = auth.uid()
  );

-- RLS Policy: Users can create invitations for alignments they created
create policy "Users can create invitations for their alignments"
  on public.alignment_invitations
  for insert
  with check (
    exists (
      select 1 from public.alignments
      where alignments.id = alignment_invitations.alignment_id
      and alignments.created_by = auth.uid()
    )
  );

-- RLS Policy: Users can update invitations for alignments they created
create policy "Users can update their alignment invitations"
  on public.alignment_invitations
  for update
  using (
    created_by = auth.uid()
  );

-- Comment for documentation
comment on table public.alignment_invitations is
  'Secure invite tokens for sharing alignments. Tokens are hashed before storage.';
