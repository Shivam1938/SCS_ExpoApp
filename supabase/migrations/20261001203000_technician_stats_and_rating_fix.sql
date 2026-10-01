-- SCS technician statistics and rating display correctness.
-- Run this migration after the existing technician workflow migration.

ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS rating_is_admin_set boolean NOT NULL DEFAULT false;

ALTER TABLE public.technicians
  ALTER COLUMN rating DROP DEFAULT,
  ALTER COLUMN rating DROP NOT NULL;

-- Newly created technicians start without an artificial rating.
CREATE OR REPLACE FUNCTION public.ensure_technician_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'technician' THEN
    INSERT INTO public.technicians
      (id, profile_id, name, role_title, rating, reviews_count, jobs_completed, rating_is_admin_set)
    SELECT
      gen_random_uuid(),
      NEW.id,
      COALESCE(NULLIF(NEW.full_name, ''), 'Technician'),
      'Service Technician',
      NULL,
      0,
      0,
      false
    WHERE NOT EXISTS (
      SELECT 1 FROM public.technicians t WHERE t.profile_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_ensure_technician_profile ON public.profiles;
CREATE TRIGGER profiles_ensure_technician_profile
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_technician_profile();

-- Mark a rating as admin-supplied when an existing technician rating changes.
CREATE OR REPLACE FUNCTION public.mark_admin_technician_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.rating IS NOT NULL THEN
    NEW.rating_is_admin_set := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS technicians_mark_admin_rating ON public.technicians;
CREATE TRIGGER technicians_mark_admin_rating
BEFORE UPDATE OF rating ON public.technicians
FOR EACH ROW
EXECUTE FUNCTION public.mark_admin_technician_rating();

-- Keep completed-job counts accurate and idempotent.
CREATE OR REPLACE FUNCTION public.update_technician_completed_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.technician_id IS NOT NULL THEN
    UPDATE public.technicians
    SET jobs_completed = COALESCE(jobs_completed, 0) + 1
    WHERE id = NEW.technician_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_update_technician_completed_jobs ON public.bookings;
CREATE TRIGGER bookings_update_technician_completed_jobs
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_technician_completed_jobs();

-- Keep review count accurate. The rating column remains admin-controlled; this
-- prevents an automatic review aggregate from overwriting an admin-entered rating.
CREATE OR REPLACE FUNCTION public.update_technician_review_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  technician_uuid uuid;
BEGIN
  technician_uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.technician_id ELSE NEW.technician_id END;
  UPDATE public.technicians t
  SET reviews_count = (SELECT count(*) FROM public.reviews r WHERE r.technician_id = technician_uuid)
  WHERE t.id = technician_uuid;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS reviews_update_technician_count ON public.reviews;
CREATE TRIGGER reviews_update_technician_count
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_technician_review_count();

UPDATE public.technicians t
SET reviews_count = (SELECT count(*) FROM public.reviews r WHERE r.technician_id = t.id),
    jobs_completed = (SELECT count(*) FROM public.bookings b WHERE b.technician_id = t.id AND b.status = 'completed');
