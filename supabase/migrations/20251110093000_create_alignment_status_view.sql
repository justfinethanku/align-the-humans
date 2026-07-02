-- Alignment status view providing derived UI statuses per context/supabase_cli.md

-- Drop existing view if present to avoid conflicts
DROP VIEW IF EXISTS public.alignment_status_view;

CREATE VIEW public.alignment_status_view AS
WITH participant_counts AS (
  SELECT alignment_id, COUNT(*) AS participant_count
  FROM public.alignment_participants
  GROUP BY alignment_id
),
response_counts AS (
  SELECT alignment_id,
         COUNT(*) FILTER (WHERE submitted_at IS NOT NULL) AS submitted_responses
  FROM public.alignment_responses
  GROUP BY alignment_id
),
signature_counts AS (
  SELECT alignment_id, COUNT(*) AS signed_count
  FROM public.alignment_signatures
  GROUP BY alignment_id
)
SELECT
  a.*,
  CASE
    WHEN a.status = 'complete' THEN 'complete'
    WHEN a.status = 'resolving'
         AND COALESCE(sc.signed_count, 0) < COALESCE(pc.participant_count, 0)
         AND a.updated_at > now() - interval '7 days'
      THEN 'aligned_awaiting_signatures'
    WHEN a.status = 'resolving' THEN 'in_conflict_resolution'
    WHEN a.status = 'active'
         AND COALESCE(rc.submitted_responses, 0) BETWEEN 1 AND COALESCE(pc.participant_count, 0) - 1
      THEN 'waiting_partner'
    WHEN a.updated_at < now() - interval '7 days' AND a.status <> 'complete' THEN 'stalled'
    ELSE a.status
  END AS ui_status,
  COALESCE(pc.participant_count, 0) AS participant_count,
  COALESCE(rc.submitted_responses, 0) AS submitted_responses,
  COALESCE(sc.signed_count, 0) AS signed_count
FROM public.alignments a
LEFT JOIN participant_counts pc ON pc.alignment_id = a.id
LEFT JOIN response_counts rc ON rc.alignment_id = a.id
LEFT JOIN signature_counts sc ON sc.alignment_id = a.id;

ALTER VIEW public.alignment_status_view SET (security_invoker = true);
GRANT SELECT ON public.alignment_status_view TO authenticated;
