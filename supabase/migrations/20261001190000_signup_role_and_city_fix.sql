-- SCS signup role/profile repair.
-- Keeps Supabase Auth + Postgres as the backend. No Firebase Auth is used.

-- Preserve the role selected on the signup screen when the existing
-- auth->profiles trigger creates the profile row.
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

-- Every technician profile gets a technician row automatically.
CREATE OR REPLACE FUNCTION public.ensure_technician_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'technician' THEN
    INSERT INTO public.technicians (id, profile_id, name, role_title)
    SELECT gen_random_uuid(), NEW.id,
           COALESCE(NULLIF(NEW.full_name, ''), 'Technician'),
           'Service Technician'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.technicians t
      WHERE t.profile_id = NEW.id
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

-- Repair accounts that were already created before the role trigger existed.
-- Only users whose Supabase Auth metadata explicitly says technician are changed.
UPDATE public.profiles p
SET role = 'technician'
FROM auth.users u
WHERE u.id = p.id
  AND u.raw_user_meta_data ->> 'role' = 'technician'
  AND p.role IS DISTINCT FROM 'technician';

INSERT INTO public.technicians (id, profile_id, name, role_title)
SELECT gen_random_uuid(), p.id,
       COALESCE(NULLIF(p.full_name, ''), 'Technician'),
       'Service Technician'
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'technician'
  AND u.raw_user_meta_data ->> 'role' = 'technician'
  AND NOT EXISTS (
    SELECT 1
    FROM public.technicians t
    WHERE t.profile_id = p.id
  );

-- Keep the profile city in sync with the user's current/default saved address.
-- The mobile API performs the sync when an address is created/updated/defaulted.
