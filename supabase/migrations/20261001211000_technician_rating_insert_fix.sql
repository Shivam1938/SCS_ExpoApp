-- Keep the admin-rating flag correct when a technician is created with an admin-entered rating.
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
BEFORE INSERT OR UPDATE OF rating ON public.technicians
FOR EACH ROW
EXECUTE FUNCTION public.mark_admin_technician_rating();
