-- SCS technician profile editing and reliable in-app booking notifications.

CREATE OR REPLACE FUNCTION public.update_my_technician_profile(
  p_name text,
  p_role_title text,
  p_about text,
  p_skills text[],
  p_years_experience integer,
  p_phone text
)
RETURNS public.technicians
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  technician_row public.technicians;
BEGIN
  SELECT t.* INTO technician_row
  FROM public.technicians t
  JOIN public.profiles p ON p.id = t.profile_id
  WHERE t.profile_id = auth.uid()
    AND p.role = 'technician'
  LIMIT 1;

  IF technician_row.id IS NULL THEN
    RAISE EXCEPTION 'Technician profile not found';
  END IF;

  UPDATE public.technicians
  SET name = NULLIF(trim(p_name), ''),
      role_title = NULLIF(trim(p_role_title), ''),
      about = COALESCE(trim(p_about), ''),
      skills = COALESCE(p_skills, ARRAY[]::text[]),
      years_experience = GREATEST(0, LEAST(COALESCE(p_years_experience, 0), 60)),
      phone = NULLIF(trim(p_phone), '')
  WHERE id = technician_row.id
  RETURNING * INTO technician_row;

  UPDATE public.profiles
  SET full_name = technician_row.name,
      phone = technician_row.phone
  WHERE id = auth.uid();

  RETURN technician_row;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_technician_profile(text, text, text, text[], integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_technician_profile(text, text, text, text[], integer, text) TO authenticated;

-- Replace the existing status notification trigger with one deterministic trigger.
-- This keeps notification rows in the Alerts tab in sync for both customers and technicians.
CREATE OR REPLACE FUNCTION public.notify_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  technician_profile_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.technician_id IS DISTINCT FROM OLD.technician_id AND NEW.technician_id IS NOT NULL THEN
      SELECT profile_id INTO technician_profile_id
      FROM public.technicians
      WHERE id = NEW.technician_id;

      IF technician_profile_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
        VALUES
        (NEW.user_id, 'Technician assigned', 'A technician has accepted your service request and will contact you after reviewing the job.', 'person-outline', true, NEW.id),
        (technician_profile_id, 'Booking assigned', 'You accepted a new service booking. Open it to review the customer and job details.', 'briefcase-outline', true, NEW.id);
      END IF;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'on_the_way' THEN
        INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
        VALUES (NEW.user_id, 'Technician on the way', 'Your technician is on the way to your service location.', 'navigate-outline', true, NEW.id);
      ELSIF NEW.status = 'in_progress' THEN
        INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
        VALUES (NEW.user_id, 'Work started', 'Your technician has started working on your service.', 'construct-outline', true, NEW.id);
      ELSIF NEW.status = 'completed' THEN
        INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
        VALUES (NEW.user_id, 'Booking completed', 'Your service booking has been marked as completed.', 'checkmark-circle-outline', true, NEW.id);
      ELSIF NEW.status = 'cancelled' THEN
        INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
        VALUES (NEW.user_id, 'Booking cancelled', 'Your service booking has been cancelled.', 'close-circle-outline', true, NEW.id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_booking ON public.bookings;
CREATE TRIGGER trg_notify_booking
AFTER UPDATE OF technician_id, status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_change();


CREATE OR REPLACE FUNCTION public.notify_technician_billing_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  technician_profile_id uuid;
BEGIN
  IF NEW.technician_id IS NULL THEN RETURN NEW; END IF;
  SELECT profile_id INTO technician_profile_id FROM public.technicians WHERE id = NEW.technician_id;
  IF technician_profile_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
    VALUES (technician_profile_id, 'Payment received', 'Payment of ₹' || COALESCE(NEW.total, 0) || ' has been marked as received for this booking.', 'checkmark-circle-outline', true, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scs_technician_billing_notifications ON public.bookings;
CREATE TRIGGER scs_technician_billing_notifications
AFTER UPDATE OF total, payment_status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_technician_billing_update();
