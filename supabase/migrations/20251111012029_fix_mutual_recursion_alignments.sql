-- Fix mutual recursion between alignments and alignment_participants tables
--
-- PROBLEM:
-- - alignments table SELECT/UPDATE policies check alignment_participants
-- - alignment_participants table SELECT policy checks alignments (in INSERT policy)
-- - This creates mutual recursion: alignments <-> alignment_participants
--
-- SOLUTION:
-- - Remove alignment_participants checks from alignments policies
-- - Use only direct column checks (created_by) on alignments table
-- - This breaks the circular dependency

-- Drop conflicting policies on alignments table
drop policy if exists "alignments_read_participants" on public.alignments;
drop policy if exists "alignments_update_participants" on public.alignments;

-- Recreate alignments SELECT policy without checking alignment_participants
-- Users can see alignments they created
create policy "alignments_read_creator" on public.alignments
for select to authenticated
using (created_by = (select auth.uid()));

-- Recreate alignments UPDATE policy without checking alignment_participants
-- Users can update alignments they created
create policy "alignments_update_creator" on public.alignments
for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));
