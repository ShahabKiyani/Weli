-- ============================================================
-- 001_create_profiles.sql
-- Public profiles table — mirrors auth.users with app fields.
-- Created automatically via trigger when a new auth user signs in.
-- ============================================================

-- Shared helper: auto-stamp updated_at on any row modification.
-- Created here (migration 001) so subsequent migrations can reuse it.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   VARCHAR(30)  UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Auto-stamp updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
