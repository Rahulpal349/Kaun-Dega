-- ============================================================
-- Migration 07: Group Roles, Secure Invite Tokens & Admin Authorization
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- ============================================================
-- PART 1: Add role column to group_members
-- ============================================================

-- Add role column with default 'member'
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

-- Add joined_at if it doesn't already exist (schema.sql has it, 01_schema.sql does not)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE group_members ADD COLUMN joined_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Backfill: set the creator of each existing group as 'admin'
UPDATE group_members gm
SET role = 'admin'
FROM groups g
WHERE gm.group_id = g.id AND gm.user_id = g.created_by;

-- ============================================================
-- PART 2: Create group_invites table
-- ============================================================

CREATE TABLE IF NOT EXISTS group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_group_invites_token ON group_invites(token);
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);

-- Enable RLS on group_invites
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- RLS: Admin of the group can manage invites
DROP POLICY IF EXISTS "admin can manage invites" ON group_invites;
CREATE POLICY "admin can manage invites"
  ON group_invites FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invites.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );

-- RLS: Any authenticated user can read an invite by token (for the join page)
DROP POLICY IF EXISTS "anyone can read invite by token" ON group_invites;
CREATE POLICY "anyone can read invite by token"
  ON group_invites FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- ============================================================
-- PART 3: RPC Functions (Server-side authorization)
-- ============================================================

-- 3a. Get user's role in a group
CREATE OR REPLACE FUNCTION public.get_user_role_in_group(p_group_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3b. Generate a secure invite token (admin-only)
CREATE OR REPLACE FUNCTION public.generate_invite_token(p_group_id UUID, p_expires_in_days INT DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  v_role TEXT;
  v_token TEXT;
  v_invite group_invites%ROWTYPE;
BEGIN
  -- Check if user is admin of this group
  SELECT role INTO v_role FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this group.';
  END IF;

  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Only the group admin can generate invite links.';
  END IF;

  -- Generate a secure 32-char random token
  v_token := encode(gen_random_bytes(24), 'base64');
  -- Make it URL-safe: replace +, /, = with URL-safe chars
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  -- Deactivate any existing active invites for this group (optional: keep only one active)
  UPDATE group_invites SET is_active = false
  WHERE group_id = p_group_id AND is_active = true;

  -- Insert the new invite
  INSERT INTO group_invites (group_id, token, created_by, expires_at)
  VALUES (p_group_id, v_token, auth.uid(), now() + (p_expires_in_days || ' days')::INTERVAL)
  RETURNING * INTO v_invite;

  RETURN json_build_object(
    'id', v_invite.id,
    'token', v_invite.token,
    'groupId', v_invite.group_id,
    'expiresAt', v_invite.expires_at,
    'createdAt', v_invite.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3c. Get invite info (for join page, any authenticated user)
CREATE OR REPLACE FUNCTION public.get_invite_info(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invite group_invites%ROWTYPE;
  v_group groups%ROWTYPE;
  v_creator_name TEXT;
  v_member_count INT;
  v_is_already_member BOOLEAN;
BEGIN
  -- Look up the invite
  SELECT * INTO v_invite FROM group_invites WHERE token = p_token;

  IF v_invite IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'This invite link is invalid.');
  END IF;

  IF NOT v_invite.is_active THEN
    RETURN json_build_object('valid', false, 'error', 'This invite link is no longer active.');
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'This invite link has expired.');
  END IF;

  -- Get group info
  SELECT * INTO v_group FROM groups WHERE id = v_invite.group_id;

  IF v_group IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'The group no longer exists.');
  END IF;

  -- Get creator name
  SELECT name INTO v_creator_name FROM profiles WHERE id = v_invite.created_by;

  -- Get member count
  SELECT COUNT(*) INTO v_member_count FROM group_members WHERE group_id = v_group.id;

  -- Check if current user is already a member
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_group.id AND user_id = auth.uid()
  ) INTO v_is_already_member;

  RETURN json_build_object(
    'valid', true,
    'groupId', v_group.id,
    'groupName', v_group.name,
    'groupEmoji', v_group.emoji,
    'invitedBy', v_creator_name,
    'memberCount', v_member_count,
    'isAlreadyMember', v_is_already_member,
    'expiresAt', v_invite.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3d. Join group by token (any authenticated user)
CREATE OR REPLACE FUNCTION public.join_group_by_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invite group_invites%ROWTYPE;
  v_group groups%ROWTYPE;
  v_is_already_member BOOLEAN;
BEGIN
  -- Look up the invite
  SELECT * INTO v_invite FROM group_invites WHERE token = p_token;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid invite link.';
  END IF;

  IF NOT v_invite.is_active THEN
    RAISE EXCEPTION 'This invite link is no longer active.';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'This invite link has expired.';
  END IF;

  -- Check group exists
  SELECT * INTO v_group FROM groups WHERE id = v_invite.group_id;
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'The group no longer exists.';
  END IF;

  -- Check if already a member
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_group.id AND user_id = auth.uid()
  ) INTO v_is_already_member;

  IF v_is_already_member THEN
    RETURN json_build_object(
      'success', true,
      'alreadyMember', true,
      'groupId', v_group.id,
      'groupName', v_group.name,
      'message', 'You are already a member of this group.'
    );
  END IF;

  -- Insert the membership with 'member' role
  INSERT INTO group_members (group_id, user_id, role, joined_at)
  VALUES (v_group.id, auth.uid(), 'member', now());

  RETURN json_build_object(
    'success', true,
    'alreadyMember', false,
    'groupId', v_group.id,
    'groupName', v_group.name,
    'message', 'You have joined the group!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3e. Delete group (admin-only)
CREATE OR REPLACE FUNCTION public.delete_group_as_admin(p_group_id UUID)
RETURNS JSON AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_role FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this group.';
  END IF;

  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Only the group admin can delete this group.';
  END IF;

  -- Deactivate all invites for this group
  UPDATE group_invites SET is_active = false WHERE group_id = p_group_id;

  -- Delete the group (CASCADE will handle group_members, expenses, expense_shares, settlements, transactions)
  DELETE FROM groups WHERE id = p_group_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Group has been deleted.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3f. Leave group (any member, but not admin — admin must delete or transfer)
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS JSON AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this group.';
  END IF;

  IF v_role = 'admin' THEN
    RAISE EXCEPTION 'The admin cannot leave the group. Delete the group instead, or transfer admin to another member first.';
  END IF;

  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'message', 'You have left the group.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 4: Update RLS policies
-- ============================================================

-- Groups: Allow admin to delete their group
DROP POLICY IF EXISTS "admin can delete group" ON groups;
CREATE POLICY "admin can delete group"
  ON groups FOR DELETE USING (
    auth.uid() = created_by
  );

-- Group members: Allow users to delete their own membership (leave)
DROP POLICY IF EXISTS "members can leave group" ON group_members;
CREATE POLICY "members can leave group"
  ON group_members FOR DELETE USING (
    user_id = auth.uid()
  );

-- Group members: Allow admin to remove members
DROP POLICY IF EXISTS "admin can remove members" ON group_members;
CREATE POLICY "admin can remove members"
  ON group_members FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );
