-- Align the DB status-transition trigger with the app state machine
-- (app/lib/types.ts VALID_STATUS_TRANSITIONS).
--
-- The original trigger only allowed the linear chain
--   draft -> active -> analyzing -> resolving -> complete
-- but the resolution loop requires resolving -> analyzing: after both
-- parties submit round-N resolutions, /api/alignment/analyze locks the
-- alignment by flipping resolving -> analyzing before re-running the AI
-- analysis. The trigger rejected that update, so no alignment could ever
-- reach resolution round 2 (or a fresh zero-conflict analysis).

CREATE OR REPLACE FUNCTION public.validate_alignment_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  valid boolean := false;
BEGIN
  -- Allow no-op updates
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Allowed transitions (mirror of VALID_STATUS_TRANSITIONS in app/lib/types.ts):
  --   draft     -> active
  --   active    -> analyzing
  --   analyzing -> resolving
  --   resolving -> complete | analyzing   (re-analysis rounds)
  --   complete  -> (terminal)
  IF OLD.status = 'draft' AND NEW.status = 'active' THEN
    valid := true;
  ELSIF OLD.status = 'active' AND NEW.status = 'analyzing' THEN
    valid := true;
  ELSIF OLD.status = 'analyzing' AND NEW.status = 'resolving' THEN
    valid := true;
  ELSIF OLD.status = 'resolving' AND NEW.status = 'complete' THEN
    valid := true;
  ELSIF OLD.status = 'resolving' AND NEW.status = 'analyzing' THEN
    valid := true;
  END IF;

  IF NOT valid THEN
    RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$function$;
