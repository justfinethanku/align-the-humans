-- Pricing now leads with a single $299-per-pair partnership pilot.
-- Allow early-access requests for it; keep the legacy tiers so old rows stay valid.
alter table public.upgrade_interest
  drop constraint if exists upgrade_interest_tier_check;

alter table public.upgrade_interest
  add constraint upgrade_interest_tier_check
  check (tier in ('partnership_pilot', 'alignment_pass', 'pro', 'team'));
