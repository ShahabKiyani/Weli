-- ============================================================
-- 008_create_friendships.sql
-- Friendships table — directional friend request model.
-- A friendship is created by a requester toward an addressee.
-- Once accepted it is treated as bidirectional by the application.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

  -- One request per ordered pair: (A→B) and (B→A) are treated as distinct at the DB level
  -- but the application enforces "search before send" to avoid mirrored duplicates
  UNIQUE (requester_id, addressee_id),

  -- Prevent self-friending
  CHECK (requester_id != addressee_id)
);

-- Performance indexes — the three most common query patterns:
-- 1. "All friendships where I am the requester" (sent requests)
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
-- 2. "All friendships where I am the addressee" (received requests)
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
-- 3. Filter by status (most queries want only 'accepted' or only 'pending')
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Auto-stamp updated_at (reuses the function defined in migration 001)
CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
