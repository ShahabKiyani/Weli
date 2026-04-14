-- ============================================================
-- 007_allow_restaurant_insert.sql
-- Allow authenticated users to insert restaurants (Google Places import).
-- Prevent duplicate imports via a unique partial index on google_place_id.
-- ============================================================

-- Authenticated users can add new restaurants (from Google Places)
CREATE POLICY "restaurants_insert_authenticated"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Prevent importing the same Google Place twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_google_place_id
  ON public.restaurants(google_place_id)
  WHERE google_place_id IS NOT NULL;
