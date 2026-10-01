-- Repair placeholder customer names from Supabase Auth metadata and allow
-- assigned technicians to read the customer identity used by their bookings.

UPDATE public.profiles p
SET full_name = COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), p.full_name)
FROM auth.users u
WHERE u.id = p.id
  AND (p.full_name IS NULL OR lower(trim(p.full_name)) IN ('customer', 'user', 'guest'))
  AND NULLIF(trim(u.raw_user_meta_data ->> 'full_name'), '') IS NOT NULL;

UPDATE public.technicians t
SET name = p.full_name
FROM public.profiles p
WHERE p.id = t.profile_id
  AND p.full_name IS NOT NULL
  AND trim(p.full_name) <> ''
  AND (t.name IS NULL OR lower(trim(t.name)) IN ('customer', 'user', 'guest', 'technician'));

DROP POLICY IF EXISTS "technicians_read_assigned_customer_profiles" ON public.profiles;
CREATE POLICY "technicians_read_assigned_customer_profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.technicians t
    JOIN public.bookings b ON b.technician_id = t.id
    WHERE t.profile_id = auth.uid() AND b.user_id = profiles.id
  )
);

DROP POLICY IF EXISTS "technicians_read_own_reviews" ON public.reviews;
CREATE POLICY "technicians_read_own_reviews"
ON public.reviews
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.technicians t
    WHERE t.id = reviews.technician_id AND t.profile_id = auth.uid()
  )
);
