-- ============================================================
-- 010_friend_feed_view.sql
-- Denormalized view for the social feed feature.
--
-- Joins reviews with their author's profile and the reviewed restaurant
-- so the frontend can display a rich feed entry in a single query.
--
-- Friend-scoping is intentionally delegated to the client:
--   supabase.from('friend_feed').select('*').in('user_id', friendIds)
--
-- This keeps the SQL simple and avoids a subquery against the
-- friendships table (which has per-user RLS), while still being safe
-- because the underlying reviews, profiles, and restaurants tables are
-- all readable by any authenticated user per their own SELECT policies.
-- ============================================================

CREATE OR REPLACE VIEW public.friend_feed AS
SELECT
  rv.id          AS review_id,
  rv.user_id,
  rv.restaurant_id,
  rv.score,
  rv.comment,
  rv.created_at,
  p.username,
  p.avatar_url,
  rest.name      AS restaurant_name,
  rest.cuisine_type,
  rest.image_url AS restaurant_image_url
FROM public.reviews rv
JOIN public.profiles    p    ON rv.user_id      = p.id
JOIN public.restaurants rest ON rv.restaurant_id = rest.id;

-- Grant SELECT to the authenticated role so PostgREST exposes the view
GRANT SELECT ON public.friend_feed TO authenticated;
