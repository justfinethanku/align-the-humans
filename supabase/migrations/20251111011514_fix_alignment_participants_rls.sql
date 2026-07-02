-- Fix infinite recursion in alignment_participants RLS policy
-- The problem: participants_read_participants was doing a self-referential check
-- Solution: Simplify to allow users to read their own records + records for alignments they created

drop policy if exists "participants_read_participants" on public.alignment_participants;

create policy "participants_read_participants" on public.alignment_participants
for select to authenticated
using (
  -- Allow users to see their own participant records
  user_id = (select auth.uid())
  or
  -- Allow users to see other participants in alignments they created
  exists (
    select 1 from public.alignments a
    where a.id = alignment_participants.alignment_id
      and a.created_by = (select auth.uid())
  )
);
