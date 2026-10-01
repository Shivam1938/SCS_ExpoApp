-- SCS technician workflow, concurrency protection and push-notification support.
-- Run this migration in the existing SCS Supabase project.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token text;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'customer';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS client_request_id text;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_user_client_request_uidx
  ON public.bookings (user_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bookings_technician_status_idx
  ON public.bookings (technician_id, status, scheduled_date, scheduled_time);

CREATE INDEX IF NOT EXISTS bookings_finding_status_idx
  ON public.bookings (status, scheduled_date, scheduled_time)
  WHERE status = 'finding_technician' AND technician_id IS NULL;

-- Preserve the selected role during automatic profile creation. This runs before
-- the existing profile insert trigger, so the normal 'preserve role' RLS policy
-- does not need to be weakened for signup.
CREATE OR REPLACE FUNCTION public.apply_signup_role_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
BEGIN
  SELECT raw_user_meta_data ->> 'role'
    INTO requested_role
  FROM auth.users
  WHERE id = NEW.id;

  IF requested_role IN ('customer', 'technician') THEN
    NEW.role := requested_role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_apply_signup_role ON public.profiles;
CREATE TRIGGER profiles_apply_signup_role
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.apply_signup_role_to_profile();

-- Create the technician-side profile row automatically when a user is registered
-- as a technician. Existing technician rows are left untouched.
CREATE OR REPLACE FUNCTION public.ensure_technician_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'technician' THEN
    INSERT INTO public.technicians (id, profile_id, name, role_title)
    SELECT gen_random_uuid(), NEW.id, COALESCE(NULLIF(NEW.full_name, ''), 'Technician'), 'Service Technician'
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


-- Prevent one technician from being assigned two active jobs at the exact same
-- scheduled date/time. Different time slots remain fully independent.
CREATE OR REPLACE FUNCTION public.prevent_technician_schedule_conflict()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.technician_id IS NOT NULL
     AND NEW.status <> 'cancelled'
     AND NEW.status <> 'completed'
     AND EXISTS (
       SELECT 1
       FROM public.bookings b
       WHERE b.id <> NEW.id
         AND b.technician_id = NEW.technician_id
         AND b.scheduled_date = NEW.scheduled_date
         AND b.scheduled_time = NEW.scheduled_time
         AND b.status NOT IN ('cancelled', 'completed')
     ) THEN
    RAISE EXCEPTION 'This technician already has a booking at the selected time.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_prevent_technician_schedule_conflict ON public.bookings;
CREATE TRIGGER bookings_prevent_technician_schedule_conflict
BEFORE INSERT OR UPDATE OF technician_id, scheduled_date, scheduled_time, status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_technician_schedule_conflict();

-- Technicians can see bookings that are available to claim and bookings assigned
-- to them. Customers keep their existing own-booking access.
DROP POLICY IF EXISTS "technicians_read_available_or_assigned_bookings" ON public.bookings;
CREATE POLICY "technicians_read_available_or_assigned_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.technicians t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE t.profile_id = auth.uid()
      AND p.role = 'technician'
      AND (
        bookings.technician_id = t.id
        OR (bookings.technician_id IS NULL AND bookings.status = 'finding_technician')
      )
  )
);

-- The database, not the mobile UI, decides who wins a concurrent Accept action.
-- Two technicians can press Accept at the same time; only the first update that
-- successfully changes technician_id from NULL can claim the booking.
DROP POLICY IF EXISTS "technicians_update_assigned_bookings" ON public.bookings;
CREATE POLICY "technicians_update_assigned_bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.technicians t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE t.profile_id = auth.uid()
      AND p.role = 'technician'
      AND (
        bookings.technician_id = t.id
        OR (bookings.technician_id IS NULL AND bookings.status = 'finding_technician')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.technicians t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE t.profile_id = auth.uid()
      AND p.role = 'technician'
      AND bookings.technician_id = t.id
  )
  AND bookings.status IN ('technician_assigned', 'on_the_way', 'in_progress', 'completed')
);

-- A technician needs the customer's basic contact/profile information only after
-- a booking is assigned to that technician.
DROP POLICY IF EXISTS "technicians_read_assigned_customer_profiles" ON public.profiles;
CREATE POLICY "technicians_read_assigned_customer_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.technicians t
    JOIN public.bookings b ON b.technician_id = t.id
    WHERE t.profile_id = auth.uid()
      AND b.user_id = profiles.id
  )
);

-- Notify every technician that a new booking is available. The existing
-- notification/push infrastructure can deliver these rows to registered devices.
CREATE OR REPLACE FUNCTION public.notify_technicians_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
  SELECT
    p.id,
    'New service request',
    COALESCE(s.name, 'A new service') || ' is available for ' || NEW.scheduled_date || ' at ' || NEW.scheduled_time || '.',
    'construct-outline',
    true,
    NEW.id
  FROM public.profiles p
  LEFT JOIN public.services s ON s.id = NEW.service_id
  WHERE p.role = 'technician';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_technicians ON public.bookings;
CREATE TRIGGER bookings_notify_technicians
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_technicians_new_booking();

-- Notify the customer when the final amount is entered or payment is recorded.
CREATE OR REPLACE FUNCTION public.notify_customer_billing_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.total IS NOT NULL AND NEW.total IS DISTINCT FROM OLD.total THEN
    INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
    VALUES (
      NEW.user_id,
      'Final amount added',
      'Your technician added a final service amount of ₹' || NEW.total || '.',
      'receipt-outline',
      true,
      NEW.id
    );
  ELSIF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    INSERT INTO public.notifications (user_id, title, body, icon, unread, booking_id)
    VALUES (
      NEW.user_id,
      'Payment received',
      'Payment of ₹' || COALESCE(NEW.total, 0) || ' has been marked as received.',
      'checkmark-circle-outline',
      true,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_customer_billing_update ON public.bookings;
CREATE TRIGGER bookings_notify_customer_billing_update
AFTER UPDATE OF service_fee, parts_estimate, discount, total, payment_status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_customer_billing_update();
