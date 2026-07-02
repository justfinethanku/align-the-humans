-- Add is_admin column to profiles table for role-based access control
-- This enables admin dashboard and privileged operations

-- Add is_admin column with default false
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Create index for admin queries (will be rarely true, so partial index is efficient)
create index if not exists profiles_is_admin_idx
  on public.profiles(is_admin)
  where is_admin = true;

-- Comment for documentation
comment on column public.profiles.is_admin is
  'Boolean flag indicating if user has admin privileges. Default false. Use sparingly for security.';
