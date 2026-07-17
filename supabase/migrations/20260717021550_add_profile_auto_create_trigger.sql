/*
# Auto-create profile on signup

## Overview
When a new user signs up via Supabase Auth, a corresponding row is automatically
inserted into the `profiles` table with the default role 'scanner'.

## Changes
1. Creates a `handle_new_user()` function that inserts a profile row.
2. Creates a trigger `on_auth_user_created` that fires after a new auth user is created.
3. Makes the function SECURITY DEFINER so it can insert into profiles even though
   the anon role doesn't have INSERT permission on profiles (only authenticated does).

## Security
- The function runs as the server (SECURITY DEFINER), not as the calling user.
- It only inserts the user's own profile row (id = NEW.id).
- Default role is 'scanner'; admins are promoted manually via SQL or the admin UI.

## Important Notes
1. This trigger ensures every new auth user gets a profile row automatically.
2. To promote a user to admin, run: UPDATE profiles SET role = 'admin' WHERE email = '...';
3. The function is idempotent — if the profile already exists, it does nothing.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
