-- ============================================================
-- 005_handle_new_user_trigger.sql
-- Auto-creates a profiles row whenever a new auth.users row is inserted.
-- Fires on every sign-up method (Google OAuth, email, etc.).
-- SECURITY DEFINER lets the function write to public.profiles even though
-- the trigger fires in the auth schema context.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    NULL,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
