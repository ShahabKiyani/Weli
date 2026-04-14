-- ============================================================
-- 004_restaurant_stats_view.sql
-- Aggregated view: every restaurant with its live avg_score and review_count.
-- Used for all list and detail queries — avoids N+1 aggregate round-trips.
-- LEFT JOIN ensures restaurants with 0 reviews still appear (score = 0.0).
-- ============================================================

CREATE OR REPLACE VIEW public.restaurant_stats AS
SELECT
  r.*,
  COALESCE(AVG(rv.score), 0)::NUMERIC(3,1) AS avg_score,
  COUNT(rv.id)::INT                         AS review_count
FROM public.restaurants r
LEFT JOIN public.reviews rv ON rv.restaurant_id = r.id
GROUP BY r.id;
