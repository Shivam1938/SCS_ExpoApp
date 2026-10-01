-- The service price is only a starting price. Final customer-visible pricing
-- is created only by the technician workflow.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS final_amount_confirmed boolean NOT NULL DEFAULT false;

UPDATE public.bookings
SET final_amount_confirmed = true
WHERE total IS NOT NULL
  AND status = 'completed'
  AND payment_status IN ('pending', 'paid');

CREATE OR REPLACE FUNCTION public.clear_initial_booking_amount()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.service_fee := NULL;
  NEW.parts_estimate := NULL;
  NEW.discount := NULL;
  NEW.total := NULL;
  NEW.final_amount_confirmed := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_bookings_clear_initial_amount ON public.bookings;
CREATE TRIGGER zz_bookings_clear_initial_amount
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.clear_initial_booking_amount();
