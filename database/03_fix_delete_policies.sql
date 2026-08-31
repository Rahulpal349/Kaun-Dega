-- ============================================================
-- Fix: Add missing DELETE policies for Row Level Security
-- ============================================================
-- Run this in the Supabase SQL Editor to permanently allow
-- deleting groups and leaving groups.

-- 1. Allow users to leave a group by deleting their own membership
DROP POLICY IF EXISTS "members can leave their group" ON group_members;
CREATE POLICY "members can leave their group"
  ON group_members FOR DELETE USING (
    user_id = auth.uid()
  );

-- 2. Allow group creators to completely delete their groups
-- Note: ON DELETE CASCADE is already set up on the foreign keys,
-- so deleting a group will automatically delete its expenses, shares, 
-- and member records.
DROP POLICY IF EXISTS "creators can delete their groups" ON groups;
CREATE POLICY "creators can delete their groups"
  ON groups FOR DELETE USING (
    created_by = auth.uid()
  );
