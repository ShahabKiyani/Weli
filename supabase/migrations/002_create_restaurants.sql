-- ============================================================
-- 002_create_restaurants.sql
-- Restaurants table. Populated via seed script only — no public writes.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurants (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100)  NOT NULL,
  address        VARCHAR(255)  NOT NULL,
  latitude       DECIMAL(9,6)  NOT NULL,
  longitude      DECIMAL(9,6)  NOT NULL,
  cuisine_type   VARCHAR(50)   NOT NULL,
  description    TEXT,
  image_url      TEXT,
  phone          VARCHAR(20),
  website        VARCHAR(255),
  google_place_id VARCHAR(255),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON public.restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_coords  ON public.restaurants(latitude, longitude);

-- Auto-stamp updated_at
CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
