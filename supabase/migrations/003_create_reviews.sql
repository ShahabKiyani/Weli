-- ============================================================
-- 003_create_reviews.sql
-- Reviews table. One review per user per restaurant (UNIQUE constraint).
-- Score enforced at DB level: integer 1–10.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID      NOT NULL REFERENCES public.profiles(id)    ON DELETE CASCADE,
  restaurant_id UUID      NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  score         SMALLINT  NOT NULL CHECK (score >= 1 AND score <= 10),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, restaurant_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON public.reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user       ON public.reviews(user_id);

-- Auto-stamp updated_at
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
