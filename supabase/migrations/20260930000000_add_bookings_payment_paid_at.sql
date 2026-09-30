ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_paid_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_booking_payment_paid_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF OLD.payment_status = 'pending' AND NEW.payment_status = 'paid' THEN
      NEW.payment_paid_at := now();
    ELSIF NEW.payment_status = 'pending' THEN
      NEW.payment_paid_at := NULL;
    ELSIF NEW.payment_status = 'refunded' THEN
      NEW.payment_paid_at := OLD.payment_paid_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_set_payment_paid_at ON public.bookings;
CREATE TRIGGER bookings_set_payment_paid_at
BEFORE UPDATE OF payment_status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_payment_paid_at();