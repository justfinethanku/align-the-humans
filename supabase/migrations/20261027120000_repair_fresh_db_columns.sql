-- Fresh databases: 20250120120000 runs before the tables exist, so its
-- `alter table if exists` steps did nothing, and the tables were then created
-- without these columns. Adding them again is a no-op wherever they already exist.

alter table if exists public.alignments
  add column if not exists clarity_draft jsonb default '{}'::jsonb not null;

alter table if exists public.alignment_invitations
  add column if not exists token_ciphertext text;
