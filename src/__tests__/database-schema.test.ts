import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const readMigration = (filename: string) =>
  readFileSync(resolve(__dirname, `../../supabase/migrations/${filename}`), 'utf-8')

describe('Migration: 001_create_profiles.sql', () => {
  const sql = readMigration('001_create_profiles.sql')

  it('creates the profiles table', () => {
    expect(sql).toMatch(/CREATE TABLE.*public\.profiles/i)
  })

  it('id is UUID primary key with FK to auth.users ON DELETE CASCADE', () => {
    expect(sql).toMatch(/id\s+UUID\s+PRIMARY KEY/i)
    expect(sql).toMatch(/REFERENCES auth\.users/i)
    expect(sql).toMatch(/ON DELETE CASCADE/i)
  })

  it('username is VARCHAR(30) UNIQUE nullable', () => {
    expect(sql).toMatch(/username\s+VARCHAR\(30\)/i)
    expect(sql).toMatch(/UNIQUE/i)
  })

  it('has avatar_url TEXT column', () => {
    expect(sql).toMatch(/avatar_url\s+TEXT/i)
  })

  it('has timestamptz created_at and updated_at', () => {
    expect(sql).toMatch(/created_at\s+TIMESTAMPTZ/i)
    expect(sql).toMatch(/updated_at\s+TIMESTAMPTZ/i)
  })

  it('enables Row Level Security', () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i)
  })

  it('creates update_updated_at_column trigger function', () => {
    expect(sql).toMatch(/update_updated_at_column/i)
  })
})

describe('Migration: 002_create_restaurants.sql', () => {
  const sql = readMigration('002_create_restaurants.sql')

  it('creates the restaurants table', () => {
    expect(sql).toMatch(/CREATE TABLE.*public\.restaurants/i)
  })

  it('has latitude and longitude as DECIMAL(9,6)', () => {
    expect(sql).toMatch(/latitude\s+DECIMAL\(9,6\)/i)
    expect(sql).toMatch(/longitude\s+DECIMAL\(9,6\)/i)
  })

  it('has google_place_id column', () => {
    expect(sql).toMatch(/google_place_id/i)
  })

  it('has index on cuisine_type', () => {
    expect(sql).toMatch(/idx_restaurants_cuisine/i)
  })

  it('has index on coordinates', () => {
    expect(sql).toMatch(/idx_restaurants_coords/i)
  })

  it('enables Row Level Security', () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i)
  })
})

describe('Migration: 003_create_reviews.sql', () => {
  const sql = readMigration('003_create_reviews.sql')

  it('creates the reviews table', () => {
    expect(sql).toMatch(/CREATE TABLE.*public\.reviews/i)
  })

  it('score has CHECK constraint between 1 and 10', () => {
    expect(sql).toMatch(/score.*CHECK.*score\s*>=\s*1.*score\s*<=\s*10/i)
  })

  it('has UNIQUE constraint on (user_id, restaurant_id)', () => {
    expect(sql).toMatch(/UNIQUE\s*\(\s*user_id\s*,\s*restaurant_id\s*\)/i)
  })

  it('user_id FK references profiles with CASCADE delete', () => {
    expect(sql).toMatch(/user_id.*REFERENCES public\.profiles/i)
    expect(sql).toMatch(/ON DELETE CASCADE/i)
  })

  it('restaurant_id FK references restaurants', () => {
    expect(sql).toMatch(/restaurant_id.*REFERENCES public\.restaurants/i)
  })

  it('has index on restaurant_id', () => {
    expect(sql).toMatch(/idx_reviews_restaurant/i)
  })

  it('has index on user_id', () => {
    expect(sql).toMatch(/idx_reviews_user/i)
  })

  it('enables Row Level Security', () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i)
  })
})

describe('Migration: 004_restaurant_stats_view.sql', () => {
  const sql = readMigration('004_restaurant_stats_view.sql')

  it('creates or replaces the restaurant_stats view', () => {
    expect(sql).toMatch(/CREATE.*VIEW.*restaurant_stats/i)
  })

  it('computes avg_score via AVG', () => {
    expect(sql).toMatch(/avg_score/i)
    expect(sql).toMatch(/AVG\s*\(\s*rv\.score\s*\)/i)
  })

  it('computes review_count via COUNT', () => {
    expect(sql).toMatch(/review_count/i)
    expect(sql).toMatch(/COUNT\s*\(\s*rv\.id\s*\)/i)
  })

  it('uses LEFT JOIN so restaurants with 0 reviews still appear', () => {
    expect(sql).toMatch(/LEFT JOIN/i)
  })

  it('uses COALESCE to default avg_score to 0', () => {
    expect(sql).toMatch(/COALESCE/i)
  })
})

describe('Migration: 005_handle_new_user_trigger.sql', () => {
  const sql = readMigration('005_handle_new_user_trigger.sql')

  it('creates the handle_new_user function', () => {
    expect(sql).toMatch(/CREATE.*FUNCTION.*handle_new_user/i)
  })

  it('inserts into public.profiles', () => {
    expect(sql).toMatch(/INSERT INTO public\.profiles/i)
  })

  it('uses SECURITY DEFINER', () => {
    expect(sql).toMatch(/SECURITY DEFINER/i)
  })

  it('creates trigger on_auth_user_created on auth.users', () => {
    expect(sql).toMatch(/CREATE TRIGGER.*on_auth_user_created/i)
    expect(sql).toMatch(/ON auth\.users/i)
  })

  it('fires AFTER INSERT', () => {
    expect(sql).toMatch(/AFTER INSERT/i)
  })

  it('seeds avatar_url from raw_user_meta_data', () => {
    expect(sql).toMatch(/raw_user_meta_data.*avatar_url/i)
  })
})

describe('Migration: 006_rls_policies.sql', () => {
  const sql = readMigration('006_rls_policies.sql')

  it('creates profiles_select policy', () => {
    expect(sql).toMatch(/profiles_select/i)
  })

  it('creates profiles_update_own with auth.uid() = id', () => {
    expect(sql).toMatch(/profiles_update_own/i)
    expect(sql).toMatch(/auth\.uid\(\)\s*=\s*id/i)
  })

  it('creates restaurants_select policy', () => {
    expect(sql).toMatch(/restaurants_select/i)
  })

  it('creates all four review policies', () => {
    expect(sql).toMatch(/reviews_select/i)
    expect(sql).toMatch(/reviews_insert_own/i)
    expect(sql).toMatch(/reviews_update_own/i)
    expect(sql).toMatch(/reviews_delete_own/i)
  })

  it('review write policies all use auth.uid() = user_id', () => {
    const uidChecks = (sql.match(/auth\.uid\(\)\s*=\s*user_id/gi) ?? []).length
    expect(uidChecks).toBeGreaterThanOrEqual(3)
  })

  it('policies scope to authenticated role', () => {
    const authenticatedClauses = (sql.match(/TO authenticated/gi) ?? []).length
    expect(authenticatedClauses).toBeGreaterThanOrEqual(5)
  })
})

describe('Migration: 008_create_friendships.sql', () => {
  const sql = readMigration('008_create_friendships.sql')

  it('creates the friendships table', () => {
    expect(sql).toMatch(/CREATE TABLE.*public\.friendships/i)
  })

  it('id is UUID primary key with gen_random_uuid() default', () => {
    expect(sql).toMatch(/id\s+UUID\s+PRIMARY KEY/i)
    expect(sql).toMatch(/gen_random_uuid\(\)/i)
  })

  it('requester_id FK references profiles ON DELETE CASCADE', () => {
    expect(sql).toMatch(/requester_id\s+UUID\s+NOT NULL/i)
    expect(sql).toMatch(/REFERENCES public\.profiles.*ON DELETE CASCADE/i)
  })

  it('addressee_id FK references profiles ON DELETE CASCADE', () => {
    expect(sql).toMatch(/addressee_id\s+UUID\s+NOT NULL/i)
  })

  it('status has CHECK constraint for pending/accepted/declined', () => {
    expect(sql).toMatch(/status.*CHECK/i)
    expect(sql).toMatch(/pending/i)
    expect(sql).toMatch(/accepted/i)
    expect(sql).toMatch(/declined/i)
  })

  it("status defaults to 'pending'", () => {
    expect(sql).toMatch(/status.*DEFAULT\s+'pending'/i)
  })

  it('has UNIQUE constraint on (requester_id, addressee_id)', () => {
    expect(sql).toMatch(/UNIQUE\s*\(\s*requester_id\s*,\s*addressee_id\s*\)/i)
  })

  it('has CHECK constraint preventing self-friending (requester_id != addressee_id)', () => {
    expect(sql).toMatch(/CHECK\s*\(\s*requester_id\s*!=\s*addressee_id\s*\)/i)
  })

  it('has index on requester_id', () => {
    expect(sql).toMatch(/idx_friendships_requester/i)
  })

  it('has index on addressee_id', () => {
    expect(sql).toMatch(/idx_friendships_addressee/i)
  })

  it('has index on status', () => {
    expect(sql).toMatch(/idx_friendships_status/i)
  })

  it('enables Row Level Security', () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i)
  })

  it('has updated_at trigger using update_updated_at_column', () => {
    expect(sql).toMatch(/CREATE TRIGGER.*friendships_updated_at/i)
    expect(sql).toMatch(/update_updated_at_column/i)
  })

  it('has timestamptz created_at and updated_at', () => {
    expect(sql).toMatch(/created_at\s+TIMESTAMPTZ/i)
    expect(sql).toMatch(/updated_at\s+TIMESTAMPTZ/i)
  })
})

describe('Migration: 009_friendships_rls.sql', () => {
  const sql = readMigration('009_friendships_rls.sql')

  it('creates friendships_select_own policy (SELECT)', () => {
    expect(sql).toMatch(/friendships_select_own/i)
    expect(sql).toMatch(/FOR SELECT/i)
  })

  it('SELECT policy uses requester_id OR addressee_id in USING clause', () => {
    expect(sql).toMatch(/requester_id/i)
    expect(sql).toMatch(/addressee_id/i)
    expect(sql).toMatch(/auth\.uid\(\)/i)
  })

  it('creates friendships_insert_requester policy (INSERT)', () => {
    expect(sql).toMatch(/friendships_insert_requester/i)
    expect(sql).toMatch(/FOR INSERT/i)
  })

  it('INSERT policy checks auth.uid() = requester_id', () => {
    expect(sql).toMatch(/auth\.uid\(\)\s*=\s*requester_id/i)
  })

  it('creates friendships_update_addressee policy (UPDATE)', () => {
    expect(sql).toMatch(/friendships_update_addressee/i)
    expect(sql).toMatch(/FOR UPDATE/i)
  })

  it('UPDATE policy restricts to addressee (auth.uid() = addressee_id)', () => {
    expect(sql).toMatch(/auth\.uid\(\)\s*=\s*addressee_id/i)
  })

  it('creates friendships_delete_own policy (DELETE)', () => {
    expect(sql).toMatch(/friendships_delete_own/i)
    expect(sql).toMatch(/FOR DELETE/i)
  })

  it('DELETE policy allows either requester or addressee', () => {
    const deleteSection = sql.slice(sql.indexOf('friendships_delete_own'))
    expect(deleteSection).toMatch(/requester_id/i)
    expect(deleteSection).toMatch(/addressee_id/i)
  })

  it('all policies scope to authenticated role', () => {
    const authenticatedClauses = (sql.match(/TO authenticated/gi) ?? []).length
    expect(authenticatedClauses).toBeGreaterThanOrEqual(4)
  })
})

describe('Migration: 010_friend_feed_view.sql', () => {
  const sql = readMigration('010_friend_feed_view.sql')

  it('creates or replaces the friend_feed view', () => {
    expect(sql).toMatch(/CREATE.*VIEW.*friend_feed/i)
  })

  it('joins the reviews table', () => {
    expect(sql).toMatch(/FROM.*public\.reviews/i)
  })

  it('joins the profiles table on user_id', () => {
    expect(sql).toMatch(/JOIN.*public\.profiles/i)
    expect(sql).toMatch(/rv\.user_id\s*=\s*p\.id/i)
  })

  it('joins the restaurants table on restaurant_id', () => {
    expect(sql).toMatch(/JOIN.*public\.restaurants/i)
    expect(sql).toMatch(/rv\.restaurant_id\s*=\s*rest\.id/i)
  })

  it('selects review_id aliased from rv.id', () => {
    expect(sql).toMatch(/rv\.id.*AS\s+review_id/i)
  })

  it('selects user_id, score and comment from reviews', () => {
    expect(sql).toMatch(/rv\.user_id/i)
    expect(sql).toMatch(/rv\.score/i)
    expect(sql).toMatch(/rv\.comment/i)
  })

  it('selects username and avatar_url from profiles', () => {
    expect(sql).toMatch(/p\.username/i)
    expect(sql).toMatch(/p\.avatar_url/i)
  })

  it('selects restaurant_name aliased from rest.name', () => {
    expect(sql).toMatch(/rest\.name.*AS\s+restaurant_name/i)
  })

  it('selects cuisine_type from restaurants', () => {
    expect(sql).toMatch(/rest\.cuisine_type/i)
  })

  it('selects restaurant_image_url aliased from rest.image_url', () => {
    expect(sql).toMatch(/rest\.image_url.*AS\s+restaurant_image_url/i)
  })

  it('grants SELECT on the view to authenticated role', () => {
    expect(sql).toMatch(/GRANT SELECT ON public\.friend_feed TO authenticated/i)
  })
})

describe('Migration: 011_storage_avatars.sql', () => {
  const sql = readMigration('011_storage_avatars.sql')

  it('inserts the avatars storage bucket with public read and size limit', () => {
    expect(sql).toMatch(/INSERT INTO storage\.buckets/i)
    expect(sql).toMatch(/'avatars'/i)
    expect(sql).toMatch(/5242880/)
  })

  it('allows public SELECT on storage.objects for the avatars bucket', () => {
    expect(sql).toMatch(/storage_avatars_select_public/i)
    expect(sql).toMatch(/ON storage\.objects FOR SELECT/i)
    expect(sql).toMatch(/bucket_id = 'avatars'/i)
  })

  it('restricts INSERT to authenticated users under their own folder', () => {
    expect(sql).toMatch(/storage_avatars_insert_own_folder/i)
    expect(sql).toMatch(/FOR INSERT/i)
    expect(sql).toMatch(/storage\.foldername\(name\)/i)
    expect(sql).toMatch(/auth\.uid\(\)/i)
  })

  it('has UPDATE and DELETE policies scoped to own folder', () => {
    expect(sql).toMatch(/storage_avatars_update_own_folder/i)
    expect(sql).toMatch(/storage_avatars_delete_own_folder/i)
  })
})
