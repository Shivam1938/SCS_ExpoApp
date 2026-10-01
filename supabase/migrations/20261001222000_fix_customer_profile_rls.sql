-- Fix technician access to customer names without creating an RLS recursion
-- between profiles and bookings.

CREATE OR REPLACE FUNCTION public.technician_can_read_customer_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.technicians t
    JOIN public.bookings b ON b.technician_id = t.id
    WHERE t.profile_id = auth.uid()
      AND b.user_id = target_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.technician_can_read_customer_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.technician_can_read_customer_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "technicians_read_assigned_customer_profiles" ON public.profiles;

CREATE POLICY "technicians_read_assigned_customer_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.technician_can_read_customer_profile(profiles.id)
);

-- Keep real signup names when repairing old placeholder profile names.
UPDATE public.profiles p
SET full_name = COALESCE(
  NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
  NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
  p.full_name
)
FROM auth.users u
WHERE u.id = p.id
  AND lower(trim(coalesce(p.full_name, ''))) IN ('customer', 'user', 'guest')
  AND (
    NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), '') IS NOT NULL
    OR NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), '') IS NOT NULL
  );
