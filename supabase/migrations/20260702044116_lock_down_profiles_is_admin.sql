-- SECURITY HOTFIX: prevent users from self-promoting to platform admin.
--
-- The initial schema granted table-wide UPDATE on public.profiles to the
-- `authenticated` role, and the own_profile_write RLS policy only restricts
-- WHICH ROW a user may update (id = auth.uid()) — not WHICH COLUMNS. When the
-- is_admin column was later added (20260217140000), nothing narrowed that
-- grant. Result: any logged-in user can PATCH their own profiles row setting
-- is_admin = true, which now cascades through the is_platform_admin()-gated
-- read-all policies (added 20260701120000) to expose every participant's raw
-- responses/analyses and grant write access to prompts + audit log.
--
-- Fix: replace the table-wide UPDATE grant with a column-scoped grant limited
-- to the fields a user legitimately edits. is_admin can then only be set by
-- the service-role key (scripts/set-admin.ts / admin tooling), which bypasses
-- column grants. RLS row-scoping (own_profile_write) still applies on top.

revoke update on public.profiles from authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;
