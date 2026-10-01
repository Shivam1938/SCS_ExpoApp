-- SCS notification repair: restore technician workflow updates and Alerts tab.
-- Safe to run after the previously applied technician notification migration.

BEGIN;

-- The existing notifications table in this project does not have booking_id.
-- The previous migration referenced it, which caused every booking status/assignment
-- update to fail with: column "booking_id" does not exist.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS booking_id uuid;

CREATE INDEX IF NOT EXISTS notifications_booking_id_idx
  ON public.notifications (booking_id);

-- Recreate booking-change notifications after the schema repair.
CREATE OR REPLACE FUNCTION public.notify_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  technician_profile_id uuid;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Technician accepted the booking.
  IF NEW.technician_id IS DISTINCT FROM OLD.technician_id
     AND NEW.technician_id IS NOT NULL THEN
    SELECT profile_id
      INTO technician_profile_id
    FROM public.technicians
    WHERE id = NEW.technician_id;

    IF technician_profile_id IS NOT NULL THEN
      INSERT INTO public.notifications
        (user_id, title, body, icon, unread, booking_id)
      VALUES
        (NEW.user_id,
         'Technician assigned',
         'A technician has accepted your service request and will contact you after reviewing the job.',
         'person-outline', true, NEW.id),
        (technician_profile_id,
         'Booking assigned',
         'You accepted a new service booking. Open it to review the customer and job details.',
         'briefcase-outline', true, NEW.id);
    END IF;
  END IF;

  -- Technician status updates.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'on_the_way' THEN
      INSERT INTO public.notifications
        (user_id, title, body, icon, unread, booking_id)
      VALUES
        (NEW.user_id, 'Technician on the way',
         'Your technician is on the way to your service location.',
         'navigate-outline', true, NEW.id);

    ELSIF NEW.status = 'in_progress' THEN
      INSERT INTO public.notifications
        (user_id, title, body, icon, unread, booking_id)
      VALUES
        (NEW.user_id, 'Work started',
         'Your technician has started working on your service.',
         'construct-outline', true, NEW.id);

    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.notifications
        (user_id, title, body, icon, unread, booking_id)
      VALUES
        (NEW.user_id, 'Booking completed',
         'Your service booking has been marked as completed.',
         'checkmark-circle-outline', true, NEW.id);

    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications
        (user_id, title, body, icon, unread, booking_id)
      VALUES
        (NEW.user_id, 'Booking cancelled',
         'Your service booking has been cancelled.',
         'close-circle-outline', true, NEW.id);
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

-- Notify the customer only when the technician actually saves a final amount.
CREATE OR REPLACE FUNCTION public.notify_customer_billing_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.total IS NOT NULL AND OLD.total IS NULL THEN
    INSERT INTO public.notifications
      (user_id, title, body, icon, unread, booking_id)
    VALUES
      (NEW.user_id,
       'Final amount confirmed',
       'Your technician has confirmed the final amount as ₹' || NEW.total || '.',
       'receipt-outline', true, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scs_customer_billing_notifications ON public.bookings;
CREATE TRIGGER scs_customer_billing_notifications
AFTER UPDATE OF total ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_customer_billing_update();

-- Notify the technician when the customer payment is marked received.
CREATE OR REPLACE FUNCTION public.notify_technician_billing_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  technician_profile_id uuid;
BEGIN
  IF NEW.technician_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT profile_id
    INTO technician_profile_id
  FROM public.technicians
  WHERE id = NEW.technician_id;

  IF technician_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    INSERT INTO public.notifications
      (user_id, title, body, icon, unread, booking_id)
    VALUES
      (technician_profile_id,
       'Payment received',
       'Payment of ₹' || COALESCE(NEW.total, 0) || ' has been marked as received for this booking.',
       'checkmark-circle-outline', true, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scs_technician_billing_notifications ON public.bookings;
CREATE TRIGGER scs_technician_billing_notifications
AFTER UPDATE OF payment_status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_technician_billing_update();

COMMIT;
