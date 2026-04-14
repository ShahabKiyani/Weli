# SPEC.md — Weli: Local Restaurant Ranking App

## 1. Overview

Weli is a community-driven web application for Amherst residents to discover, rank, and review local restaurants. Users score restaurants on a 1–10 scale, write text reviews, and browse an aggregated leaderboard powered by proximity-sorted discovery.

The backend is powered entirely by **Supabase** (hosted PostgreSQL, Auth with Google OAuth, auto-generated REST API, Row Level Security). There is no custom backend server — the React frontend communicates directly with Supabase via the `@supabase/supabase-js` client SDK.

### Goals

| # | Goal | Success Metric |
|---|------|----------------|
| G1 | Enable authentic community restaurant reviews | ≥ 50 reviews within first month of launch |
| G2 | Surface restaurants by physical proximity | Location-sorted list loads < 1s on 4G |
| G3 | Provide a frictionless review flow | Review submission ≤ 3 taps from discovery |
| G4 | Maintain data integrity | One review per user per restaurant, enforced at DB level |
| G5 | Zero-friction onboarding | Google OAuth sign-in with one click |
| G6 | Visual spatial discovery | Interactive map view with restaurant pins on the discover page |
| G7 | Frictionless restaurant search | Google Places auto-populates top 5 results as user types — no extra click |
| G8 | Social restaurant discovery | Users can add friends and see their reviews in a dedicated feed |

### Non-Goals (v1)

- Native mobile apps (iOS / Android)
- Restaurant owner dashboards or claim flows
- Payment / reservation integration
- Photo uploads on reviews (profile avatar upload is in scope; see US-30)
- Liking or commenting on individual reviews
- Email/password auth (stretch — Google OAuth is primary and sufficient for v1)

---

## 2. User Stories

### 2.1 Authentication

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-1 | As a visitor, I can sign in with my Google account so I can participate in the community. | Clicking "Sign in with Google" redirects to Google consent screen; on success, Supabase creates a session and a `profiles` row (via DB trigger); user is redirected to dashboard. |
| US-2 | As a first-time Google user, I am prompted to choose a username after OAuth completes. | If `profiles.username` is null after OAuth callback, redirect to a one-time username-setup page; username is validated (3–30 chars, unique); user cannot access other pages until username is set. |
| US-3 | As a logged-in user, I can log out. | `supabase.auth.signOut()` clears the session; user is redirected to login page; protected routes reject unauthenticated access. |
| US-4 | As a returning user, my session persists across page refreshes. | Supabase session is stored in localStorage; `onAuthStateChange` re-hydrates auth state on mount. |

### 2.2 Dashboard

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-5 | As a logged-in user, I see a summary of my review activity on my dashboard. | Dashboard shows total review count, average score given, and a chronological feed of my reviews. |
| US-6 | As a logged-in user, I can click any review in my feed to navigate to that restaurant's detail page. | Clicking a `ReviewItem` navigates to `/restaurants/:id`. |

### 2.3 Restaurant Discovery

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-7 | As a logged-in user, I can browse all Amherst restaurants sorted by distance from my current location. | Browser prompts for geolocation; restaurants display with calculated distance (e.g., "0.8 mi"); list re-sorts on location change. |
| US-8 | As a logged-in user, I can filter restaurants by cuisine type. | Selecting a cuisine chip filters the list in real-time; "All" resets the filter. Filtering applies to both list and map views. |
| US-9 | As a logged-in user, I can sort restaurants by highest rated instead of closest. | Toggle switches sort key; UI reflects current sort mode. |
| US-10 | As a user who denied location access, I see restaurants sorted alphabetically with no distance shown. | Graceful fallback; no error; a banner suggests enabling location. Map centers on Amherst town center. |
| US-11a | As a logged-in user, I can switch between a list view and an interactive map view of restaurants. | Toggle button switches views; map shows pins for all visible (filtered) restaurants; map centers on user location or Amherst center as fallback. |
| US-11b | As a logged-in user, I can click a map marker to see a restaurant summary and navigate to its detail page. | Clicking a pin opens an info window with restaurant name, cuisine, avg score, and a "View Details" link. |
| US-11c | As a logged-in user, hovering a restaurant card highlights its marker on the map (and vice versa). | Hovered card's marker bounces or changes color; hovered marker highlights the corresponding card in the list. |

### 2.4 Restaurant Details

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-12 | As a logged-in user, I can view a restaurant's details including name, address, cuisine, aggregate score, and total review count. | Data loads from `restaurant_stats` view; aggregate score shows one decimal (e.g., 8.4/10). |
| US-13 | As a logged-in user, I can see the restaurant's location on an embedded map with a "Get Directions" link. | Map shows a single pin at the restaurant's coordinates; "Get Directions" opens Google Maps in a new tab with the restaurant as destination. |
| US-14 | As a logged-in user, I can read all community reviews for a restaurant. | Reviews paginate (20 per page); each shows username, score, comment, and relative date ("3 days ago"). |
| US-15 | As a logged-in user, I can navigate to the review form by clicking "Leave a Review". | Button navigates to `/restaurants/:id/review`; if user already reviewed, button reads "Edit Your Review" and pre-fills the form. |

### 2.5 Reviewing

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-16 | As a logged-in user, I can submit a 1–10 score and text comment for a restaurant. | Score is required; comment is optional; on success, user is redirected to restaurant detail page and sees their review. |
| US-17 | As a logged-in user, I can edit my existing review for a restaurant. | Form pre-fills with previous score and comment; submission upserts the record. |
| US-18 | As a logged-in user, I can delete my review. | Confirmation modal appears; on confirm, review is removed; restaurant aggregate recalculates. |

### 2.6 Enhanced Search (Google Places Auto-Populate)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-19 | As a logged-in user, when I type a restaurant name in the search bar, I see Google Places suggestions automatically after a brief pause. | When search query reaches ≥ 2 characters, a debounced (500ms) Google Places text search fires automatically; top 5 results (de-duped against existing DB restaurants) appear below the local results. No manual "Search Google Maps" button is needed. |
| US-20 | As a logged-in user, I can add a Google Places result to Weli without leaving the search flow. | Each Places result shows an "Add to Weli" button; clicking it imports the restaurant into the DB and the result disappears from the Places list (now in local results). |

### 2.7 Friends

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-21 | As a logged-in user, I can search for other users by username and send them a friend request. | Profile page has a "Find Friends" section with a search input; typing a username queries the `profiles` table; matching users appear with a "Send Request" button. |
| US-22 | As a logged-in user, I can see and manage incoming friend requests. | Profile page shows a "Friend Requests" section listing pending requests with Accept / Decline buttons; accepting changes status to `accepted`; declining changes status to `declined`. |
| US-23 | As a logged-in user, I can see my friends list on my profile page. | Profile page shows a "Friends" section with avatars and usernames of all accepted friends; each links to that friend's public profile. |
| US-24 | As a logged-in user, I can unfriend someone. | Friends list entries have an "Unfriend" option (via confirmation modal); removes the friendship row. |
| US-25 | As a logged-in user, I see up to 5 suggested friends based on my friend network. | Profile page shows a "Suggested Friends" section; suggestions are users who are friends-of-friends but not yet my friends; ranked by number of mutual connections. |
| US-26 | As a logged-in user, I can view another user's public profile. | Navigating to `/profile/:userId` shows their username, avatar, review count, average score, and mutual friends count. If not already friends, a "Send Request" / "Request Pending" button is shown. |
| US-30 | As a logged-in user, I can change my profile picture from the My Profile page. | My Profile shows a clear control to upload or replace a photo; on success, `profiles.avatar_url` updates, the nav avatar updates, and the new image appears everywhere the user is shown. Invalid file types / oversized files show a helpful error. |
| US-31 | As a logged-in user, I see my activity stats without redundant "Member since" text. | `UserStatsCard` shows **Member since** only once, as a subtitle under **@username** (not repeated in the stats grid). The three-column stats row is **Reviews** \| **Avg Score** \| **Friends** (friend count), reusing the same card on Dashboard and My Profile for consistency. |

### 2.8 Feed

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-27 | As a logged-in user, I can see a chronological feed of my friends' reviews. | The "Feed" tab (in the main nav) shows reviews from accepted friends, newest first; each entry shows friend avatar, username, restaurant name (linked), score badge, comment snippet, and relative date. |
| US-28 | As a logged-in user, the feed shows an empty state when I have no friends yet. | Empty state with illustration, "Add friends to see their reviews here", and a CTA button to go to the profile/friends page. |
| US-29 | As a logged-in user, I can paginate through the feed. | Feed uses standard pagination (20 items per page); pagination controls at the bottom. |

---

## 3. Data Models

### 3.1 Architecture

Supabase manages `auth.users` internally. The app's public schema has four tables and two views:

```
auth.users 1──1 profiles 1──* reviews *──1 restaurants
                    │
                    ├──* friendships (as requester)
                    └──* friendships (as addressee)
```

A profile maps 1:1 to an auth user. A profile can author many reviews. A restaurant can receive many reviews. The pair `(user_id, restaurant_id)` is unique. A friendship connects two profiles with a status lifecycle: pending → accepted (or declined).

### 3.2 Table Definitions

#### `profiles` (public schema)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, FK → `auth.users.id` ON DELETE CASCADE |
| `username` | VARCHAR(30) | UNIQUE (nullable until set after first OAuth) |
| `avatar_url` | TEXT | NULLABLE (seeded from Google profile picture) |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` |

Auto-created via trigger: when a new row appears in `auth.users`, a corresponding `profiles` row is inserted with `id = auth.users.id` and `avatar_url` extracted from `raw_user_meta_data->>'avatar_url'`.

#### `restaurants`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `name` | VARCHAR(100) | NOT NULL |
| `address` | VARCHAR(255) | NOT NULL |
| `latitude` | DECIMAL(9,6) | NOT NULL |
| `longitude` | DECIMAL(9,6) | NOT NULL |
| `cuisine_type` | VARCHAR(50) | NOT NULL |
| `description` | TEXT | NULLABLE |
| `image_url` | TEXT | NULLABLE |
| `phone` | VARCHAR(20) | NULLABLE |
| `website` | VARCHAR(255) | NULLABLE |
| `google_place_id` | VARCHAR(255) | NULLABLE (used for Google Maps deep-linking and "Get Directions") |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` |

Indexes: `idx_restaurants_cuisine` on `cuisine_type`; `idx_restaurants_coords` on `(latitude, longitude)`.

#### `reviews`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `user_id` | UUID | NOT NULL, FK → `profiles.id` ON DELETE CASCADE |
| `restaurant_id` | UUID | NOT NULL, FK → `restaurants.id` ON DELETE CASCADE |
| `score` | SMALLINT | NOT NULL, CHECK `score >= 1 AND score <= 10` |
| `comment` | TEXT | NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` |

Constraints: `UNIQUE(user_id, restaurant_id)`.
Indexes: `idx_reviews_restaurant` on `restaurant_id`; `idx_reviews_user` on `user_id`.

#### `friendships`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `requester_id` | UUID | NOT NULL, FK → `profiles.id` ON DELETE CASCADE |
| `addressee_id` | UUID | NOT NULL, FK → `profiles.id` ON DELETE CASCADE |
| `status` | VARCHAR(20) | NOT NULL, default `'pending'`, CHECK `status IN ('pending', 'accepted', 'declined')` |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` |

Constraints: `UNIQUE(requester_id, addressee_id)`, `CHECK(requester_id != addressee_id)`.
Indexes: `idx_friendships_requester` on `requester_id`; `idx_friendships_addressee` on `addressee_id`; `idx_friendships_status` on `status`.

A friendship is directional at creation (requester → addressee) but once accepted it is treated as bidirectional. To query "all friends of user X", match rows where `(requester_id = X OR addressee_id = X) AND status = 'accepted'`.

### 3.3 Database View

#### `restaurant_stats` (view)

```sql
CREATE VIEW restaurant_stats AS
SELECT
  r.*,
  COALESCE(AVG(rv.score), 0)::NUMERIC(3,1) AS avg_score,
  COUNT(rv.id)::INT AS review_count
FROM restaurants r
LEFT JOIN reviews rv ON rv.restaurant_id = r.id
GROUP BY r.id;
```

This view is queried by the frontend for restaurant lists and detail pages, avoiding N+1 aggregate queries.

#### `friend_feed` (view)

```sql
CREATE VIEW friend_feed AS
SELECT
  rv.id AS review_id,
  rv.user_id,
  rv.restaurant_id,
  rv.score,
  rv.comment,
  rv.created_at,
  p.username,
  p.avatar_url,
  rest.name AS restaurant_name,
  rest.cuisine_type,
  rest.image_url AS restaurant_image_url
FROM reviews rv
JOIN profiles p ON rv.user_id = p.id
JOIN restaurants rest ON rv.restaurant_id = rest.id;
```

The frontend filters this view to only show reviews from accepted friends by passing friend user IDs in the query. RLS on the underlying `reviews` table ensures all rows are readable by authenticated users.

### 3.4 Database Trigger

#### Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    NULL,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.5 Row Level Security Policies

#### `profiles`

| Policy | Operation | Rule |
|--------|-----------|------|
| `profiles_select` | SELECT | `true` (all authenticated users can read any profile) |
| `profiles_update_own` | UPDATE | `auth.uid() = id` (users update only their own) |

#### `restaurants`

| Policy | Operation | Rule |
|--------|-----------|------|
| `restaurants_select` | SELECT | `true` (all authenticated users can read) |

Inserts/updates/deletes on restaurants are restricted to service role (seed scripts / admin).

#### `reviews`

| Policy | Operation | Rule |
|--------|-----------|------|
| `reviews_select` | SELECT | `true` (all authenticated users can read) |
| `reviews_insert_own` | INSERT | `auth.uid() = user_id` |
| `reviews_update_own` | UPDATE | `auth.uid() = user_id` |
| `reviews_delete_own` | DELETE | `auth.uid() = user_id` |

#### `friendships`

| Policy | Operation | Rule |
|--------|-----------|------|
| `friendships_select_own` | SELECT | `auth.uid() = requester_id OR auth.uid() = addressee_id` |
| `friendships_insert_requester` | INSERT | `auth.uid() = requester_id` |
| `friendships_update_addressee` | UPDATE | `auth.uid() = addressee_id` (only addressee can accept/decline) |
| `friendships_delete_own` | DELETE | `auth.uid() = requester_id OR auth.uid() = addressee_id` (either party can unfriend) |

---

## 4. API Layer (Supabase Client SDK)

There is **no custom REST API**. The frontend uses `@supabase/supabase-js` to interact with Supabase's auto-generated PostgREST API and Auth endpoints. All authorization is handled by RLS policies — the Supabase client automatically attaches the user's JWT.

### 4.1 Auth Operations

| Operation | Supabase SDK Call |
|-----------|-------------------|
| Sign in with Google | `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` |
| Handle OAuth callback | `supabase.auth.exchangeCodeForSession(code)` on the `/auth/callback` route |
| Get current session | `supabase.auth.getSession()` |
| Listen for auth changes | `supabase.auth.onAuthStateChange(callback)` |
| Sign out | `supabase.auth.signOut()` |
| Get user profile | `supabase.from('profiles').select('*').eq('id', userId).single()` |
| Set username (first login) | `supabase.from('profiles').update({ username }).eq('id', userId)` |
| Update profile avatar | Upload image to **Supabase Storage** (e.g. bucket `avatars`, path `{userId}/{filename}`), then `supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)`; RLS must allow users to update only their own `profiles` row. Client calls `refreshProfile()` after success so UI re-renders. Max file size and allowed MIME types (e.g. JPEG, PNG, WebP) enforced in UI and optionally via Storage policies. |

### 4.2 Restaurant Queries

| Operation | Supabase SDK Call |
|-----------|-------------------|
| List restaurants with stats | `supabase.from('restaurant_stats').select('*')` + optional `.eq('cuisine_type', cuisine)` + `.order(sortField)` + `.range(from, to)` |
| Get single restaurant | `supabase.from('restaurant_stats').select('*').eq('id', restaurantId).single()` |
| Get distinct cuisines | `supabase.from('restaurants').select('cuisine_type')` then deduplicate client-side (or use a Postgres function) |

Distance calculation (Haversine) is performed **client-side** after fetching restaurant coordinates — keeps the Supabase query simple and avoids needing a custom Postgres function.

### 4.3 Google Maps Integration

| Operation | Implementation |
|-----------|----------------|
| Load Maps SDK | `@vis.gl/react-google-maps` `APIProvider` wrapping the app with `VITE_GOOGLE_MAPS_API_KEY` |
| Discovery map | `Map` component centered on user location (or `42.3732, -72.5199` Amherst fallback); `AdvancedMarker` per restaurant with score badge overlay |
| Marker info window | `InfoWindow` on marker click — restaurant name, cuisine, avg score, "View Details" link |
| Restaurant detail map | `Map` component (static zoom, single `AdvancedMarker`) with "Get Directions" link: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&destination_place_id={google_place_id}` |
| Map/list sync | Hovering a restaurant card sets `highlightedId` state; `AdvancedMarker` reads this to apply bounce/highlight class; clicking a marker scrolls list to corresponding card |

### 4.4 Friendship Queries

| Operation | Supabase SDK Call |
|-----------|-------------------|
| List accepted friends | `supabase.from('friendships').select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)').or('requester_id.eq.{userId},addressee_id.eq.{userId}').eq('status', 'accepted')` |
| List pending requests (incoming) | `supabase.from('friendships').select('*, requester:profiles!requester_id(*)').eq('addressee_id', userId).eq('status', 'pending')` |
| Send friend request | `supabase.from('friendships').insert({ requester_id: userId, addressee_id: targetId })` |
| Accept friend request | `supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId)` |
| Decline friend request | `supabase.from('friendships').update({ status: 'declined' }).eq('id', requestId)` |
| Unfriend | `supabase.from('friendships').delete().eq('id', friendshipId)` |
| Search users by username | `supabase.from('profiles').select('id, username, avatar_url').ilike('username', '%query%').limit(10)` |
| Get friend IDs for feed | Query accepted friendships, extract the other user's ID from each row |
| Get friend feed | `supabase.from('friend_feed').select('*').in('user_id', friendIds).order('created_at', { ascending: false }).range(from, to)` |
| Suggested friends (friends-of-friends) | Fetch friends of current user → for each, fetch their friends → filter out self and existing friends → rank by mutual count → take top 5 |

### 4.5 Review Queries

| Operation | Supabase SDK Call |
|-----------|-------------------|
| List reviews for restaurant | `supabase.from('reviews').select('*, profiles(username, avatar_url)').eq('restaurant_id', id).order('created_at', { ascending: false }).range(from, to)` |
| Get user's review for restaurant | `supabase.from('reviews').select('*').eq('restaurant_id', id).eq('user_id', userId).maybeSingle()` |
| Get all user's reviews | `supabase.from('reviews').select('*, restaurants(id, name, cuisine_type)').eq('user_id', userId).order('created_at', { ascending: false })` |
| Create review | `supabase.from('reviews').insert({ user_id, restaurant_id, score, comment })` |
| Update review | `supabase.from('reviews').update({ score, comment, updated_at: new Date() }).eq('id', reviewId)` |
| Delete review | `supabase.from('reviews').delete().eq('id', reviewId)` |

### 4.6 Error Handling

Supabase client returns `{ data, error }`. All query wrapper functions should:
1. Check `error` and throw a typed `AppError` if present.
2. Map Supabase error codes: `23505` (unique violation) → "You've already reviewed this restaurant", `42501` (RLS violation) → "Not authorized", `PGRST116` (no rows) → "Not found".
3. TanStack Query's `onError` callback displays user-facing toast messages.

---

## 5. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend framework | React 18 + TypeScript | Type safety, ecosystem maturity |
| Build tool | Vite | Fast HMR, ES module-native |
| Routing | React Router v6 | Standard for React SPAs |
| Server state | TanStack Query (React Query) | Caching, refetching, pagination |
| Client state | React Context | Lightweight; sufficient for auth + geolocation |
| Styling | Tailwind CSS 4 | Utility-first, rapid prototyping |
| Maps | Google Maps JavaScript API via `@vis.gl/react-google-maps` | Interactive discovery map, restaurant detail map, marker info windows |
| Backend | Supabase (BaaS) | Auth, PostgreSQL, REST API, RLS — no custom server needed |
| Auth | Supabase Auth + Google OAuth | One-click sign-in, managed sessions, secure token handling |
| Database | Supabase PostgreSQL | Hosted, managed, with built-in PostgREST |
| Client SDK | `@supabase/supabase-js` | Type-safe queries, auth integration, realtime-ready |
| Validation | Zod | Client-side form validation + type inference |
| Testing | Vitest (unit) + Playwright (e2e) | Fast, modern toolchain |

---

## 6. UI Design Language

### 6.1 Design Principles

1. **Clarity over cleverness** — Every screen has one primary action.
2. **Content-first** — Restaurant data and reviews dominate the viewport; chrome is minimal.
3. **Progressive disclosure** — Filters, sort options, and secondary actions live behind toggles, not alongside primary content.
4. **Accessible by default** — WCAG 2.1 AA contrast ratios; keyboard-navigable; semantic HTML.

### 6.2 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#E85D2C` | Warm burnt orange — CTAs, active states, score highlights |
| `--color-primary-light` | `#FFF0EB` | Primary tint — hover backgrounds, selected chips |
| `--color-secondary` | `#1B4332` | Deep forest green — navbar, headings |
| `--color-surface` | `#FAFAF8` | Off-white — page backgrounds |
| `--color-card` | `#FFFFFF` | Pure white — card surfaces |
| `--color-text` | `#1A1A1A` | Near-black — body text |
| `--color-text-muted` | `#6B7280` | Gray — secondary text, metadata |
| `--color-border` | `#E5E7EB` | Light gray — card borders, dividers |
| `--color-error` | `#DC2626` | Red — validation errors |
| `--color-success` | `#16A34A` | Green — success toasts |

### 6.3 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page title | Inter | 28px / 1.75rem | 700 (Bold) |
| Section heading | Inter | 20px / 1.25rem | 600 (Semibold) |
| Card title | Inter | 16px / 1rem | 600 |
| Body text | Inter | 14px / 0.875rem | 400 (Regular) |
| Caption / metadata | Inter | 12px / 0.75rem | 400 |
| Score display | Inter | 32px / 2rem | 800 (Extrabold) |

Line heights: headings at 1.2, body at 1.5.

### 6.4 Spacing System

Based on a 4px grid: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`.

| Context | Value |
|---------|-------|
| Card padding | 16px |
| Card gap (in lists) | 12px |
| Section margin | 32px |
| Page horizontal padding | 16px (mobile), 24px (tablet), 0 with max-width container (desktop) |

### 6.5 Layout

- **Max content width:** 768px (centered).
- **Breakpoints:** `sm: 640px`, `md: 768px`, `lg: 1024px`.
- Mobile-first; single column throughout. Cards stack vertically.
- Navbar: sticky top, 56px height.

### 6.6 Component Patterns

#### Cards

- White background, 1px `--color-border`, `border-radius: 12px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`.
- On hover: subtle lift — `translateY(-1px)` + shadow increase over 150ms.

#### Buttons

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | `--color-primary` | white | none |
| Secondary | transparent | `--color-primary` | 1px solid `--color-primary` |
| Ghost | transparent | `--color-text-muted` | none |
| Google | `#FFFFFF` | `#1A1A1A` | 1px solid `--color-border` |

All buttons: `border-radius: 8px`, padding `10px 20px`, font-weight 600, 150ms transition.
Disabled state: 50% opacity, `cursor: not-allowed`.
Google button: includes Google "G" logo SVG on the left, centered text "Sign in with Google".

#### Score Badge

- Circular, 48x48px, `--color-primary` background, white text, extrabold weight.
- Inline variant: pill shape (`border-radius: 999px`), padding `2px 10px`, smaller font.

#### Form Inputs

- `border-radius: 8px`, 1px `--color-border`, padding `10px 14px`.
- Focus: 2px ring in `--color-primary` with `0.2` opacity outer glow.
- Error: border becomes `--color-error`; helper text below in `--color-error`.

#### Score Selector (Review Form)

- Row of 10 circular buttons (36x36px each), numbered 1–10.
- Default: outlined in `--color-border`.
- Selected: filled `--color-primary`, white text, scale 1.1 with spring animation.
- Labels beneath: "1" → "Awful", "5" → "Average", "10" → "Outstanding".

#### Toast Notifications

- Fixed bottom-right, auto-dismiss after 4s.
- Success: `--color-success` left border accent.
- Error: `--color-error` left border accent.

### 6.7 Motion

- Page transitions: fade-in 200ms ease-out.
- Card hover: `transform: translateY(-1px)` over 150ms.
- Score selector: spring animation on select (CSS `transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)`).
- Skeleton loaders for all async data fetches (pulsing gray rectangles matching content layout).

### 6.8 Iconography

- Lucide React icon set (consistent stroke width, MIT licensed).
- Icon size: 20px default, 16px in compact contexts.
- Colors inherit from parent text color.

---

## 7. Page Wireframe Descriptions

### Login

Centered card on a `--color-surface` background. Logo + app name at top. Large "Sign in with Google" button (white with Google logo) as the primary CTA. Divider ("or") below with email/password form as secondary option (stretch goal — may be omitted in v1). Clean, minimal — no split layout needed since OAuth is one-click.

### Username Setup (first-time only)

Full-screen centered card. "Welcome to Weli! Choose a username." Single input for username with validation (3–30 chars, alphanumeric + underscores, unique). "Continue" primary button. Shown only once after first Google sign-in.

### Dashboard

- Top: greeting ("Welcome back, Shahab") + `UserStatsCard`: avatar, **@username**, **Member since** (subtitle only — not duplicated in the grid), then a three-stat row: **Reviews** \| **Avg Score** \| **Friends** (accepted friend count).
- Below: `ReviewFeed` — vertical list of `ReviewItem` cards. Each card: restaurant name (linked), score badge, comment snippet (2 lines, truncated), relative date. Empty state: illustration + "You haven't reviewed any restaurants yet" + CTA to discover.

**Navigation:** Navbar links are **Dashboard**, **Discover**, **Feed**. Avatar dropdown includes **My Profile** and **Sign out**.

### Find Restaurants

- `LocationPrompt` banner at top if permission not yet granted.
- `FilterBar`: horizontal scrollable chip row for cuisines + sort toggle (Closest / Top Rated) + view toggle (List / Map).
- **List view:** `RestaurantList` — cards show image thumbnail (left), name + cuisine + distance + avg score (right). Skeleton loading for initial fetch.
- **Map view:** `RestaurantMap` — full-width Google Map (height: 60vh on mobile, 500px on desktop) centered on user location or Amherst center. Each restaurant rendered as an `AdvancedMarker` with a small score badge. Clicking a marker opens an `InfoWindow` with name, cuisine, score, and a "View Details" link. Active filters apply to map markers too.
- **Auto-populate Google Places:** When the user types ≥ 2 characters in the search bar, a debounced (500ms) Google Places text search fires automatically. Up to 5 results (de-duped against existing restaurants) appear in a "From Google Maps" section below the local results. Each result has an "Add to Weli" button for instant import. The manual "Search Google Maps" button is removed.
- **Split view (desktop ≥ 1024px, stretch goal):** list on left, map on right; hovering a card highlights the marker and vice versa.

### Restaurant Detail

- Hero section: restaurant name, address, cuisine chip, large score display.
- `RestaurantLocationMap`: embedded Google Map (height: 200px, rounded corners) with single pin. Below the map: "Get Directions" link (opens Google Maps with `google_place_id` as destination).
- `ActionRow`: "Leave a Review" (or "Edit Your Review") primary button.
- `CommunityReviewsList`: review cards with user avatar (from Google), username, score badge, comment, date. Pagination at bottom.

### Review Form

- Header: "How was your experience at [Name]?"
- `ScoreSelector`: 1–10 button row.
- `CommentBox`: textarea with character count (0/2000).
- `SubmitButton`: full-width primary button.
- On edit mode: "Delete Review" ghost button below.

### Profile (own)

- Accessed from the avatar dropdown in the navbar ("My Profile").
- Top: `UserStatsCard` (same layout as dashboard) — avatar (with **change photo** control on this page only), **@username**, **Member since** (once, under the name), stats grid **Reviews** \| **Avg Score** \| **Friends**. No duplicate "Member since" in the third column; that slot is **Friends** count.
- **Friend Requests** section (if any pending): list of incoming requests with requester avatar, username, Accept / Decline buttons. Badge count shown in navbar avatar dropdown.
- **Friends** section: grid/list of friend avatars + usernames (each linking to `/profile/:id`). Friend count displayed. "Find Friends" button opens search.
- **Find Friends** modal/section: search input that queries profiles by username (debounced). Results show avatar, username, "Send Request" button (or "Already Friends" / "Request Pending" status).
- **Suggested Friends** section: up to 5 suggested users (friends-of-friends), each with avatar, username, mutual friend count, "Send Request" button.

### Profile (other user)

- Reached via `/profile/:userId` (clicking a friend's name anywhere, or from search results).
- Header: avatar, @username, member since, review count, avg score.
- Relationship status: "Friends" (with Unfriend option), "Request Sent" (pending), "Send Request" button, or "Accept Request" if they sent one.
- Mutual friends count displayed.
- Their recent reviews (read-only list, paginated).

### Feed

- Accessed from the "Feed" tab in main navigation.
- Chronological list of reviews from accepted friends, newest first.
- Each `FeedItem`: friend avatar + username (linked to profile), restaurant name + cuisine (linked to detail), score badge, comment snippet (2-line clamp), relative date.
- Pagination at bottom (20 items per page).
- Empty state: illustration + "Add friends to see their reviews here" + CTA to profile page.
- Skeleton loading while fetching.

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Auth | Supabase Auth handles OAuth tokens, session refresh, and password hashing (if email auth added) |
| Authorization | Row Level Security on every table; `auth.uid()` enforced at database level |
| XSS | React's default escaping; CSP headers via hosting config |
| SQL injection | Supabase client uses parameterized queries (PostgREST) |
| Token exposure | Supabase anon key is safe to expose (RLS enforces access); session tokens stored in localStorage by Supabase SDK |
| Data validation | Zod schemas on all form submissions client-side; CHECK constraints in PostgreSQL |
| Sensitive data | `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GOOGLE_MAPS_API_KEY` — anon key is public by design; no service role key in frontend |
| Google Maps API key | Restricted in Google Cloud Console: HTTP referrer restrictions (production domain + localhost), API restrictions (Maps JavaScript API only), billing alerts |
| Profile avatars (Storage) | Supabase Storage bucket for avatars: public read (or signed URLs) as needed; **write** limited to authenticated users uploading only under their own `userId` path; validate MIME type and max size in app; optional virus scanning in production |

---

## 9. Seed Data

The app ships with a SQL seed file (`supabase/seed.sql`) containing ≥ 20 real Amherst restaurants with accurate coordinates, addresses, and cuisine types. Seed is run via the Supabase SQL editor or CLI. No fake reviews are seeded — the community generates content.
