-- Add clarity draft storage for alignments
alter table if exists public.alignments
  add column if not exists clarity_draft jsonb default '{}'::jsonb not null;

-- Persist encrypted invite tokens for retrieval
alter table if exists public.alignment_invitations
  add column if not exists token_ciphertext text;

-- Function to atomically increment invite usage capped by max_uses
create or replace function public.increment_invite_usage(invite_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated boolean;
begin
  update public.alignment_invitations
  set current_uses = coalesce(current_uses, 0) + 1
  where id = invite_id
    and invalidated_at is null
    and (max_uses is null or coalesce(current_uses, 0) < max_uses)
  returning true into updated;

  return coalesce(updated, false);
end;
$$;

grant execute on function public.increment_invite_usage(uuid) to authenticated;

-- Helper to roll back usage count if participant insert fails
create or replace function public.decrement_invite_usage(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.alignment_invitations
  set current_uses = greatest(coalesce(current_uses, 0) - 1, 0)
  where id = invite_id;
end;
$$;

grant execute on function public.decrement_invite_usage(uuid) to authenticated;
