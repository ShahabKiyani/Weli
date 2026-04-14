# Supabase Setup

## Running Migrations

Open the **Supabase SQL editor** for your project and run each migration file in order:

```
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_restaurants.sql
supabase/migrations/003_create_reviews.sql
supabase/migrations/004_restaurant_stats_view.sql
supabase/migrations/005_handle_new_user_trigger.sql
supabase/migrations/006_rls_policies.sql
supabase/migrations/007_allow_restaurant_insert.sql
```

Then run the seed data:

```
supabase/seed.sql
```

## Order matters

| # | File | Depends on |
|---|------|-----------|
| 1 | `001_create_profiles.sql` | `auth.users` (built-in) |
| 2 | `002_create_restaurants.sql` | — |
| 3 | `003_create_reviews.sql` | profiles, restaurants |
| 4 | `004_restaurant_stats_view.sql` | restaurants, reviews |
| 5 | `005_handle_new_user_trigger.sql` | profiles |
| 6 | `006_rls_policies.sql` | all three tables |
| 7 | `007_allow_restaurant_insert.sql` | restaurants |
| 8 | `seed.sql` | restaurants |

## Re-running migrations

All DDL statements use `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE` where applicable, so migrations are safe to re-run in development.

## Google OAuth setup

1. In Supabase Dashboard → Authentication → Providers → Google
2. Enable Google and paste your OAuth Client ID and Secret from Google Cloud Console
3. Copy the **Redirect URL** shown by Supabase and add it to your Google OAuth app's Authorized Redirect URIs

## Google Place IDs

The `google_place_id` column is seeded as `NULL`. To populate it:
1. Use the [Google Places API Place Search](https://developers.google.com/maps/documentation/places/web-service/search) with each restaurant name + address
2. Update rows: `UPDATE restaurants SET google_place_id = 'ChIJ...' WHERE name = '...'`
