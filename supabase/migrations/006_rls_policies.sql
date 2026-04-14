-- ============================================================
-- 006_rls_policies.sql
-- Row Level Security policies for all public tables.
-- All policies scope to the `authenticated` role — anon users
-- are rejected at the database layer regardless of client requests.
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------

-- Any signed-in user can read any profile (for displaying usernames/avatars on reviews)
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile (username setup, avatar change)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- RESTAURANTS
-- ------------------------------------------------------------

-- Any signed-in user can read restaurants; all writes are service-role only (seed/admin)
CREATE POLICY "restaurants_select"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------

-- Any signed-in user can read all reviews
CREATE POLICY "reviews_select"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert reviews attributed to themselves
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reviews
CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own reviews
CREATE POLICY "reviews_delete_own"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
