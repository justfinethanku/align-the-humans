-- =========================================
-- Realtime RLS for alignment-scoped channels
-- Topic pattern: alignment:<alignment_id>:responses
-- Requires: alignment_participants(alignment_id, user_id) populated
-- =========================================

-- Ensure RLS is enabled (it is by default in Supabase projects, but assert)
alter table realtime.messages enable row level security;

-- Recommended: restrict policies to authenticated users
grant select, insert on realtime.messages to authenticated;

-- Helper: participants can receive (SELECT) alignment messages
-- Only for private topics matching 'alignment:<uuid>:responses'
drop policy if exists "alignment_participants_can_receive" on realtime.messages;
create policy "alignment_participants_can_receive"
on realtime.messages
for select
to authenticated
using (
  private = true
  and topic like 'alignment:%:responses'
  and exists (
    select 1
    from public.alignment_participants ap
    where ap.user_id = (select auth.uid())
      and ap.alignment_id = split_part(topic, ':', 2)::uuid
  )
);

-- Helper: participants can send (INSERT) alignment messages
-- Restrict to private topics and valid alignment membership
drop policy if exists "alignment_participants_can_send" on realtime.messages;
create policy "alignment_participants_can_send"
on realtime.messages
for insert
to authenticated
with check (
  private = true
  and topic like 'alignment:%:responses'
  and exists (
    select 1
    from public.alignment_participants ap
    where ap.user_id = (select auth.uid())
      and ap.alignment_id = split_part(topic, ':', 2)::uuid
  )
);

-- Additional topic for general events (alignment:<alignment_id>:events)
drop policy if exists "alignment_participants_can_receive_events" on realtime.messages;
create policy "alignment_participants_can_receive_events"
on realtime.messages
for select
to authenticated
using (
  private = true
  and topic like 'alignment:%:events'
  and exists (
    select 1
    from public.alignment_participants ap
    where ap.user_id = (select auth.uid())
      and ap.alignment_id = split_part(topic, ':', 2)::uuid
  )
);

drop policy if exists "alignment_participants_can_send_events" on realtime.messages;
create policy "alignment_participants_can_send_events"
on realtime.messages
for insert
to authenticated
with check (
  private = true
  and topic like 'alignment:%:events'
  and exists (
    select 1
    from public.alignment_participants ap
    where ap.user_id = (select auth.uid())
      and ap.alignment_id = split_part(topic, ':', 2)::uuid
  )
);
