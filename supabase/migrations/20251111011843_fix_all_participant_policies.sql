-- Complete fix for alignment_participants RLS policies to prevent infinite recursion
-- Problem: Policies were doing self-referential checks causing infinite loops
-- Solution: Remove all circular dependencies and use direct table checks only

-- Drop all existing policies
drop policy if exists "participants_read_participants" on public.alignment_participants;
drop policy if exists "participants_insert_creator" on public.alignment_participants;

-- Recreate with no circular dependencies

-- SELECT policy: Users can see their own participant records + records for alignments they created
create policy "participants_read_participants" on public.alignment_participants
for select to authenticated
using (
  -- Allow users to see their own participant records
  user_id = (select auth.uid())
  or
  -- Allow users to see participant records for alignments they created
  exists (
    select 1 from public.alignments a
    where a.id = alignment_participants.alignment_id
      and a.created_by = (select auth.uid())
  )
);

-- INSERT policy: Only alignment creators can add participants
create policy "participants_insert_creator" on public.alignment_participants
for insert to authenticated
with check (
  exists (
    select 1 from public.alignments a
    where a.id = alignment_participants.alignment_id
      and a.created_by = (select auth.uid())
  )
);
