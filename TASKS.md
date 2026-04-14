# TASKS.md — Weli: Ordered Build Plan

Every task is atomic — completable in a single focused session, testable in isolation, and version-controllable as one commit.

**Architecture:** Single Vite React app (no custom backend). Supabase provides auth (Google OAuth), database (PostgreSQL), and API (PostgREST via client SDK). Authorization via Row Level Security.

---

## Phase 0: Project Scaffolding

- [x] **T-001** Initialize project with `npm create vite@latest` (React + TypeScript template) in root. Configure `tsconfig.json` paths.
- [x] **T-002** Install and configure Tailwind CSS 4.
- [x] **T-003** Install core dependencies: `@supabase/supabase-js`, `react-router-dom`, `@tanstack/react-query`, `zod`, `date-fns`, `lucide-react`, `@vis.gl/react-google-maps`.
- [x] **T-004** Create `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GOOGLE_MAPS_API_KEY`. Add `.env` to `.gitignore`. Update `.env.example` with all three keys.
- [x] **T-005** Create `src/lib/supabase.ts` — initialize and export the Supabase client using env vars. Create `src/lib/constants.ts` — export Google Maps API key and Amherst center coordinates (`42.3732, -72.5199`) as map defaults.
- [x] **T-006** Install dev tooling: ESLint, Prettier; add config files.

---

## Phase 1: Supabase Database Setup

- [x] **T-007** Create `profiles` table in Supabase SQL editor — `id` (UUID, PK, FK → auth.users.id ON DELETE CASCADE), `username` (VARCHAR(30) UNIQUE NULLABLE), `avatar_url` (TEXT), `created_at`, `updated_at`. Enable RLS.
- [x] **T-008** Create database trigger `handle_new_user` — on INSERT into `auth.users`, auto-create a `profiles` row with `id = NEW.id` and `avatar_url` from `raw_user_meta_data->>'avatar_url'`.
- [x] **T-009** Create `restaurants` table — `id` (UUID PK), `name`, `address`, `latitude` (DECIMAL 9,6), `longitude` (DECIMAL 9,6), `cuisine_type`, `description`, `image_url`, `phone`, `website`, `google_place_id` (VARCHAR 255, nullable), `created_at`, `updated_at`. Add indexes on `cuisine_type` and `(latitude, longitude)`. Enable RLS.
- [x] **T-010** Create `reviews` table — `id` (UUID PK), `user_id` (FK → profiles.id ON DELETE CASCADE), `restaurant_id` (FK → restaurants.id ON DELETE CASCADE), `score` (SMALLINT, CHECK 1–10), `comment` (TEXT), `created_at`, `updated_at`. Add UNIQUE constraint on `(user_id, restaurant_id)`. Enable RLS.
- [x] **T-011** Create `restaurant_stats` view — joins restaurants with AVG(score) and COUNT(reviews). Used for all restaurant list/detail queries.
- [x] **T-012** Write and apply RLS policies: `profiles` (select all, update own), `restaurants` (select all, no public write), `reviews` (select all, insert/update/delete own with `auth.uid() = user_id`).
- [x] **T-013** Write and run seed SQL (`supabase/seed.sql`) — insert ≥ 20 real Amherst restaurants with accurate names, addresses, coordinates, cuisine types, and Google Place IDs (looked up via Google Maps).

---

## Phase 2: Frontend Foundation

- [x] **T-014** Set up React Router v6 with route structure: `/login`, `/setup-username`, `/dashboard`, `/restaurants`, `/restaurants/:id`, `/restaurants/:id/review`, `/auth/callback`.
- [x] **T-015** Create `AuthContext` and `AuthProvider` — wraps app; calls `supabase.auth.getSession()` on mount; subscribes to `onAuthStateChange`; exposes `{ user, profile, session, loading, signInWithGoogle, signOut }`.
- [x] **T-016** Add profile fetching to `AuthProvider` — after session is established, fetch `profiles` row for the user; if `username` is null, set a `needsUsername` flag.
- [x] **T-017** Create `ProtectedRoute` wrapper — redirects to `/login` if no session; redirects to `/setup-username` if `needsUsername` is true.
- [x] **T-018** Install and configure TanStack Query — `QueryClientProvider` at app root with sensible defaults (staleTime, retry).
- [x] **T-019** Wrap app with `@vis.gl/react-google-maps` `APIProvider` — pass `VITE_GOOGLE_MAPS_API_KEY`; loads Maps JavaScript API once for the entire app.
- [x] **T-020** Create `src/lib/errors.ts` — Supabase error mapper that translates error codes (`23505`, `42501`, `PGRST116`) to user-friendly messages.

---

## Phase 3: Layout & Shared Components

- [x] **T-021** Build `NavBar` component — logo/app name, links (Dashboard, Discover), user avatar + logout dropdown, responsive hamburger menu on mobile. Sticky, 56px height.
- [x] **T-022** Build `AppLayout` component — NavBar + centered content container (max-width 768px) + bottom padding.
- [x] **T-023** Build shared `ScoreBadge` component — circular 48x48 variant and inline pill variant. Color-coded by score range (1–3 red, 4–6 amber, 7–10 primary).
- [x] **T-024** Build shared `Card` component — white surface, border, radius, hover lift.
- [x] **T-025** Build shared `Button` component — Primary, Secondary, Ghost, Google variants with loading spinner state.
- [x] **T-026** Build shared `Input` component — label, input, error message; focus ring styling.
- [x] **T-027** Build shared `SkeletonLoader` component — pulsing rectangles matching card and list layouts.
- [x] **T-028** Build shared `Toast` system — context-based; success/error variants; auto-dismiss 4s; fixed bottom-right.
- [x] **T-029** Build shared `Pagination` component — page numbers with prev/next, disabled states.
- [x] **T-030** Build shared `EmptyState` component — illustration placeholder, message, optional CTA button.
- [x] **T-031** Build shared `ConfirmModal` component — title, message, confirm/cancel buttons; used for destructive actions.

---

## Phase 4: Auth Pages

- [x] **T-032** Build `LoginPage` — centered card with logo, "Sign in with Google" button (calls `supabase.auth.signInWithOAuth`); redirects to `/auth/callback`.
- [x] **T-033** Build `AuthCallbackPage` — reads code from URL params, calls `supabase.auth.exchangeCodeForSession(code)`, redirects to `/dashboard` (or `/setup-username` if new user).
- [x] **T-034** Build `SetupUsernamePage` — input for username with Zod validation (3–30 chars, alphanumeric + underscores); checks uniqueness against `profiles` table; on submit, updates profile and redirects to `/dashboard`.
- [x] **T-035** Wire up sign-out — `NavBar` logout button calls `supabase.auth.signOut()`, clears query cache, redirects to `/login`.

---

## Phase 5: Dashboard

- [x] **T-036** Create `useMyReviews` hook — TanStack Query wrapper around `supabase.from('reviews').select('*, restaurants(id, name, cuisine_type)').eq('user_id', userId)` with pagination.
- [x] **T-037** Create `useMyStats` hook — TanStack Query wrapper that fetches review count and average score for the current user (aggregated from reviews).
- [x] **T-038** Build `UserStatsCard` — displays review count, average score given, member since date, user avatar from Google.
- [x] **T-039** Build `ReviewItem` card — restaurant name (linked), score badge, comment snippet (2-line clamp), relative date (using `date-fns` `formatDistanceToNow`).
- [x] **T-040** Build `DashboardPage` — greeting header, `UserStatsCard`, `ReviewFeed` (list of `ReviewItem`), skeleton loading, empty state with CTA to discover.

---

## Phase 6: Restaurant Discovery

- [x] **T-041** Create `useGeolocation` hook — requests permission, returns `{ lat, lng, loading, error, denied }`.
- [x] **T-042** Create `useRestaurants` hook — TanStack Query wrapper around `supabase.from('restaurant_stats').select('*')` with cuisine filter, sorting (name/rating), and pagination. Accepts `lat`/`lng` and computes Haversine distance client-side, sorting by distance when requested.
- [x] **T-043** Create `useCuisines` hook — fetches distinct `cuisine_type` values from restaurants table.
- [x] **T-044** Build `LocationPrompt` banner — shown when geolocation not yet granted; "Enable location for distance sorting" with allow/dismiss buttons.
- [x] **T-045** Build `FilterBar` — horizontal scrollable cuisine chips (from `useCuisines`) + sort toggle (Closest / Top Rated / A-Z) + view toggle (List / Map icons).
- [x] **T-046** Build `RestaurantCard` — image placeholder, name, cuisine chip, avg score badge, distance (or "—"), click navigates to `/restaurants/:id`. Accepts `highlighted` prop for map hover sync.
- [x] **T-047** Build `RestaurantMap` component — Google `Map` centered on user location (fallback: Amherst center `42.3732, -72.5199`). Renders `AdvancedMarker` per restaurant with `ScoreBadge` overlay. On marker click, opens `InfoWindow` with name, cuisine, avg score, and "View Details" link to `/restaurants/:id`.
- [x] **T-048** Add map/list hover sync to `DiscoverPage` — `highlightedId` state shared between `RestaurantCard` list and `RestaurantMap`; hovering a card highlights the marker (scale/color change), hovering a marker scrolls to and highlights the card.
- [x] **T-049** Build `DiscoverPage` — `LocationPrompt` + `FilterBar` + togglable `RestaurantList` / `RestaurantMap` powered by `useRestaurants`. Passes geolocation coords when available. Skeleton loading. Pagination (list view). Cuisine filter applies to both views.

---

## Phase 7: Restaurant Detail

- [x] **T-050** Create `useRestaurant` hook — TanStack Query wrapper for single restaurant from `restaurant_stats` view by ID.
- [x] **T-051** Create `useRestaurantReviews` hook — TanStack Query wrapper for reviews with joined `profiles(username, avatar_url)`, sorted/paginated.
- [x] **T-052** Create `useUserReview` hook — fetches the current user's review for a specific restaurant (if any).
- [x] **T-053** Build `RestaurantHeader` — name, address, cuisine chip, large score display, review count.
- [x] **T-054** Build `RestaurantLocationMap` — embedded Google `Map` (200px height, rounded, non-interactive zoom) with single `AdvancedMarker`. Below: "Get Directions" link (`https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&destination_place_id={google_place_id}`) opens in new tab.
- [x] **T-055** Build `ActionRow` — "Leave a Review" primary button (or "Edit Your Review" if `useUserReview` returns data); links to `/restaurants/:id/review`.
- [x] **T-056** Build `PublicReviewCard` — avatar (from Google), username, score badge, comment text, relative date.
- [x] **T-057** Build `RestaurantDetailPage` — assembles header, location map, action row, community reviews list (paginated). Skeleton loading.

---

## Phase 8: Review Form

- [x] **T-058** Build `ScoreSelector` component — row of 10 circular buttons; spring animation on select; labels at 1/5/10.
- [x] **T-059** Create `useSubmitReview` hook — TanStack Query mutation wrapping `supabase.from('reviews').insert(...)`. Invalidates restaurant and review queries on success.
- [x] **T-060** Create `useUpdateReview` hook — TanStack Query mutation wrapping `supabase.from('reviews').update(...)`.eq('id', reviewId)`. Invalidates caches on success.
- [x] **T-061** Create `useDeleteReview` hook — TanStack Query mutation wrapping `supabase.from('reviews').delete().eq('id', reviewId)`. Invalidates caches on success.
- [x] **T-062** Build `ReviewFormPage` — fetches restaurant name for header, renders `ScoreSelector` + textarea (with char count) + submit button. Uses create or update hook based on whether user has existing review. Redirects to restaurant detail on success. Toast on error.
- [x] **T-063** Add edit mode to `ReviewFormPage` — if `useUserReview` returns data, pre-fill score and comment; show "Delete Review" ghost button with `ConfirmModal`.

---

## Phase 9: Integration & Polish

- [x] **T-064** End-to-end smoke test — verify complete user flow: Google sign-in → set username → discover (list + map views) → view restaurant (with map) → leave review → see review on dashboard → edit review → delete review → sign out.
- [x] **T-065** Add page transition animations (fade-in 200ms).
- [x] **T-066** Implement responsive design pass — test and fix layouts at 375px, 768px, 1024px widths. Ensure map renders correctly at all breakpoints.
- [x] **T-067** Add meta tags, favicon, and `<title>` per page (via React Helmet or router loader).
- [x] **T-068** Accessibility audit — keyboard navigation, focus management, aria labels, screen reader testing. Ensure map markers are keyboard-accessible.

---

## Phase 10: Testing & Deployment

- [x] **T-069** Write Vitest unit tests for utility functions (Haversine distance, error mapper, Zod schemas).
- [x] **T-070** Write Vitest component tests for key shared components (ScoreBadge, ScoreSelector, Button, Input).
- [x] **T-071** Write Playwright e2e test: full user journey (login → discover → map interaction → review → dashboard).
- [x] **T-072** Add production build scripts; configure Vite build output.
- [x] **T-073** Configure deployment (Vercel/Netlify) — set env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_MAPS_API_KEY`), configure redirect rules for SPA routing (`/* → /index.html`).
- [x] **T-074** Write deployment `README.md` — setup instructions, env var reference, Supabase setup guide, Google Maps API key setup guide, seed instructions, local dev workflow.

---

## Phase 11: Enhanced Search (Auto-Populate Google Places)

- [x] **T-075** Create `useDebounce` hook — generic debounce hook that returns a debounced value after a configurable delay (default 500ms). Accepts any value type.
- [x] **T-076** Update `usePlacesSearch` hook — add a `maxResults` option (default 5) to cap the number of returned Google Places candidates. Ensure deduplication against existing DB restaurants still works.
- [x] **T-077** Update `DiscoverPage` — remove the manual "Search Google Maps" button. Auto-trigger `searchPlaces` via `useDebounce` when the search query reaches ≥ 2 characters. Clear places results when query is cleared or drops below 2 chars. Places results appear automatically below local restaurant results.
- [x] **T-078** Update `PlacesResults` component — add a compact/inline variant for auto-populated results. Show a subtle "From Google Maps" label. Limit displayed results to 5. Add a loading shimmer while searching.

---

## Phase 12: Friends Database & Backend

- [x] **T-079** Create `friendships` table migration (`008_create_friendships.sql`) — `id` (UUID PK), `requester_id` (FK → profiles ON DELETE CASCADE), `addressee_id` (FK → profiles ON DELETE CASCADE), `status` (VARCHAR(20), default 'pending', CHECK IN ('pending', 'accepted', 'declined')), `created_at`, `updated_at`. UNIQUE(requester_id, addressee_id). CHECK(requester_id != addressee_id). Indexes on requester_id, addressee_id, status. Enable RLS. Add `updated_at` trigger.
- [x] **T-080** Create `friendships` RLS policies migration (`009_friendships_rls.sql`) — SELECT: own rows (requester or addressee). INSERT: requester must be auth.uid(). UPDATE: only addressee can accept/decline. DELETE: either party can remove.
- [x] **T-081** Create `friend_feed` view migration (`010_friend_feed_view.sql`) — joins reviews + profiles + restaurants to provide a denormalized feed-ready view. All authenticated users can SELECT (actual friend-scoping is done client-side via `.in('user_id', friendIds)`).
- [x] **T-082** Update `database.types.ts` — add `Friendships` table type (Row, Insert, Update), `FriendFeed` view type, and convenience aliases (`Friendship`, `FriendFeedEntry`). Add `FriendshipWithProfiles` join type.

---

## Phase 13: Friends Hooks & Shared Components

- [x] **T-083** Create `useFriends` hook — TanStack Query wrapper that fetches all accepted friendships for the current user, joining both `requester` and `addressee` profiles. Returns a normalized list of friend profiles (always the "other" user).
- [x] **T-084** Create `useFriendRequests` hook — TanStack Query wrapper for incoming pending friend requests (where `addressee_id = currentUser`). Includes requester profile data.
- [x] **T-085** Create `useSendFriendRequest` mutation hook — inserts a new friendship row with status 'pending'. Handles 23505 (duplicate) error gracefully ("Request already sent").
- [x] **T-086** Create `useRespondFriendRequest` mutation hook — updates friendship status to 'accepted' or 'declined'. Invalidates friends and requests caches on success.
- [x] **T-087** Create `useUnfriend` mutation hook — deletes the friendship row. Shows confirmation modal before executing. Invalidates friends cache.
- [x] **T-088** Create `useSearchUsers` hook — debounced search of `profiles` by username using `ilike`. Excludes current user. Returns up to 10 results. Annotates each result with friendship status (none, pending, accepted).
- [x] **T-089** Create `useSuggestedFriends` hook — fetches friends-of-friends. For each friend, fetch their accepted friendships. Collect profiles that are not the current user and not already friends. Rank by number of mutual connections. Return top 5.
- [x] **T-090** Build `FriendCard` shared component — avatar, username, action button (Send Request / Accept / Pending / Friends). Compact variant for lists, full variant for suggestions (shows mutual friend count).
- [x] **T-091** Build `FriendRequestCard` component — avatar, username, "sent you a friend request" text, Accept and Decline buttons with loading states.

---

## Phase 14: Profile Page

- [x] **T-092** Add `/profile` and `/profile/:userId` routes to React Router. Add `ProfilePage` and `PublicProfilePage` to `App.tsx` inside the protected route group.
- [x] **T-093** Update `NavBar` — add "Feed" link to the main nav links array. Add "My Profile" item to the avatar dropdown menu (both desktop and mobile). Show a badge on the avatar when there are pending friend requests.
- [x] **T-094** Update `ROUTES` constants — add `PROFILE`, `PUBLIC_PROFILE(id)`, `FEED`. Update `QUERY_KEYS` with `FRIENDS`, `FRIEND_REQUESTS`, `SUGGESTED_FRIENDS`, `SEARCH_USERS`, `FRIEND_FEED`, `PUBLIC_PROFILE`.
- [x] **T-095** Build `ProfilePage` — own profile view: `UserStatsCard` at top, Friend Requests section (if any pending), Friends list section with count and "Find Friends" button, Suggested Friends section (top 5).
- [x] **T-096** Build `FindFriendsModal` — modal dialog with search input (debounced), results list showing `FriendCard` for each match with contextual action button (Send Request / Pending / Already Friends). Accessible (focus trap, ESC to close).
- [x] **T-097** Build `PublicProfilePage` — view another user's profile at `/profile/:userId`. Shows their stats (username, avatar, review count, avg score), friendship action button (Send Request / Accept / Pending / Unfriend), mutual friends count, and their recent reviews (paginated, read-only).
- [x] **T-098** Create `usePublicProfile` hook — fetches a profile by ID along with their review stats (count, avg score), friendship status with the current user, and mutual friend count.

---

## Phase 15: Feed Page

- [x] **T-099** Create `useFriendFeed` hook — fetches the current user's friend IDs via `useFriends`, then queries `friend_feed` view filtered to those IDs, ordered by `created_at` DESC, with pagination (20 per page).
- [x] **T-100** Build `FeedItem` component — friend avatar + linked username, restaurant name + cuisine (linked to `/restaurants/:id`), score badge, comment snippet (2-line clamp), relative date. Consistent with `ReviewItem` styling but includes friend identity.
- [x] **T-101** Build `FeedPage` — full page with `AppLayout`. Shows chronological feed of friend reviews via `useFriendFeed`. Skeleton loading state. Pagination at bottom. Empty state: "Add friends to see their reviews here" + CTA button linking to `/profile`.
- [x] **T-102** Build `FeedEmptyState` — dedicated empty state for feed: illustration, message about adding friends, prominent CTA to profile page.

---

## Phase 16: Profile Picture & UserStatsCard Layout

Planned in SPEC (US-30, US-31): users can update their profile photo from **My Profile**; **`UserStatsCard`** shows **Member since** only under **@username** and uses the third stat column for **Friends** count (removing the duplicate "Member since" cell).

- [x] **T-107** Refactor **`UserStatsCard`** — Remove the third **`StatCell`** labeled "Member Since". Keep a single **Member since** line in the header next to **@username** only. Add optional prop **`friendsCount`** (number \| undefined) and render the third column as **Friends** with that count (show **—** while loading or if omitted). Update loading skeleton to match (three columns: Reviews, Avg Score, Friends).
- [x] **T-108** Wire **friends count** into **`UserStatsCard`** on **`DashboardPage`** and **`ProfilePage`** — use **`useFriends(user?.id)`** and pass **`friendsCount={friends?.length ?? 0}`** (or equivalent) so Dashboard and My Profile stay in sync with SPEC.
- [x] **T-109** **Profile photo upload (My Profile only)** — Add UI on **`ProfilePage`** (not Dashboard): e.g. "Change photo" on avatar, hidden file input, preview, upload to Supabase Storage (`avatars` bucket or project convention), then **`profiles.update({ avatar_url })`**; **`AuthContext.refreshProfile()`** after success; toasts on error; disable oversized / wrong-type files. Add Storage bucket + RLS policies via migration if not already present; document env if any.

---

## Phase 17: Integration & Polish (v2 Features)

- [ ] **T-103** End-to-end test of search auto-populate — verify typing in search auto-shows Google Places results, importing works, results disappear after import.
- [ ] **T-104** End-to-end test of friends flow — send request → accept → see in friends list → see friend's review in feed → unfriend → feed is empty.
- [ ] **T-105** Responsive design pass for new pages — test Profile, Feed, FindFriendsModal at 375px, 768px, 1024px. Ensure friend cards and feed items render correctly on all breakpoints.
- [ ] **T-106** Accessibility audit for new features — keyboard navigation on friend actions, modal focus management, aria labels on friend request badges, screen reader announcements for friend status changes.

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 0 | T-001 – T-006 | Project scaffolding |
| 1 | T-007 – T-013 | Supabase database setup |
| 2 | T-014 – T-020 | Frontend foundation (incl. Google Maps provider) |
| 3 | T-021 – T-031 | Shared components |
| 4 | T-032 – T-035 | Auth pages (Google OAuth) |
| 5 | T-036 – T-040 | Dashboard |
| 6 | T-041 – T-049 | Restaurant discovery (list + map views) |
| 7 | T-050 – T-057 | Restaurant detail (with location map) |
| 8 | T-058 – T-063 | Review form |
| 9 | T-064 – T-068 | Integration & polish |
| 10 | T-069 – T-074 | Testing & deployment |
| 11 | T-075 – T-078 | Enhanced search (auto-populate Google Places) |
| 12 | T-079 – T-082 | Friends database & backend |
| 13 | T-083 – T-091 | Friends hooks & shared components |
| 14 | T-092 – T-098 | Profile page |
| 15 | T-099 – T-102 | Feed page |
| 16 | T-107 – T-109 | Profile picture & UserStatsCard layout |
| 17 | T-103 – T-106 | Integration & polish (v2 features) |
| **Total** | **109 tasks** | |
