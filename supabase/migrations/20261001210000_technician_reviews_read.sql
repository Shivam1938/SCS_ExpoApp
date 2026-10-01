-- Allow technicians to read the customer reviews written for their own technician profile.
-- This does not expose reviews belonging to other technicians.
DROP POLICY IF EXISTS "technicians_read_own_reviews" ON public.reviews;

CREATE POLICY "technicians_read_own_reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.technicians t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE t.id = reviews.technician_id
      AND t.profile_id = auth.uid()
      AND p.role = 'technician'
  )
);
