-- Allow failed analysis runs to roll back to their pre-lock status.
-- First-round analysis locks active -> analyzing and must be able to roll back
-- analyzing -> active. Re-analysis locks resolving -> analyzing and already
-- rolls forward/back to resolving.

CREATE OR REPLACE FUNCTION public.validate_alignment_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  valid boolean := false;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'active' THEN
    valid := true;
  ELSIF OLD.status = 'active' AND NEW.status = 'analyzing' THEN
    valid := true;
  ELSIF OLD.status = 'analyzing' AND NEW.status IN ('active', 'resolving') THEN
    valid := true;
  ELSIF OLD.status = 'resolving' AND NEW.status IN ('complete', 'analyzing') THEN
    valid := true;
  END IF;

  IF NOT valid THEN
    RAISE EXCEPTION 'Invalid alignment status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;
