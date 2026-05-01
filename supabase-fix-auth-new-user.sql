-- Fixes "Database error saving new user" during OAuth signup.
-- Run this once in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_email TEXT;
  v_avatar TEXT;
  v_role user_role;
BEGIN
  v_email := LOWER(TRIM(COALESCE(NEW.email, NEW.raw_user_meta_data->>'email')));
  IF v_email = '' THEN
    v_email := NULL;
  END IF;

  -- Keep insert non-failing even if provider omitted email.
  IF v_email IS NULL THEN
    v_email := CONCAT(NEW.id::text, '@no-email.local');
  END IF;

  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    split_part(v_email, '@', 1),
    'user'
  );

  v_avatar := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), '')
  );

  v_role := CASE
    WHEN v_email = 'amarbiradar147@gmail.com' THEN 'admin'::user_role
    ELSE 'student'::user_role
  END;

  -- Primary upsert by auth id.
  INSERT INTO public.users (id, name, email, avatar, role)
  VALUES (NEW.id, v_name, v_email, v_avatar, v_role)
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar = EXCLUDED.avatar;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Most common failure: same email already exists with old/different user id.
    -- Do not break auth signup.
    UPDATE public.users
    SET
      name = COALESCE(v_name, public.users.name),
      avatar = COALESCE(v_avatar, public.users.avatar),
      role = COALESCE(public.users.role, v_role)
    WHERE LOWER(public.users.email) = v_email;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
