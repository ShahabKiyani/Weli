-- ============================================================
-- 009_friendships_rls.sql
-- Row Level Security policies for the friendships table.
--
-- Ownership model:
--   requester  — the user who initiated the friendship
--   addressee  — the user who received the request
--
-- Only parties involved in a friendship row can see or mutate it.
-- The addressee is the sole actor who can accept or decline.
-- Either party can dissolve the friendship (unfriend).
-- ============================================================

-- Any party to the friendship can read it.
-- This covers: viewing my sent requests, my received requests, and accepted friends.
CREATE POLICY "friendships_select_own"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Only the requester can create a friendship row, and must identify as themselves.
-- This prevents users from spoofing others as the sender.
CREATE POLICY "friendships_insert_requester"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Only the addressee can update status (accept / decline).
-- The requester cannot retract by updating — they must delete instead.
CREATE POLICY "friendships_update_addressee"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

-- Either party can remove the friendship (unfriend or cancel a sent request).
CREATE POLICY "friendships_delete_own"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
