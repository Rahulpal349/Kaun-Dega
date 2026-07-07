-- ============================================================
-- Kaun Dega? — Shadow Users Support
-- ============================================================
-- Run this in the Supabase SQL Editor to allow creating 
-- placeholder profiles for users who haven't registered yet.

-- 1. Drop the foreign key constraint that forces profiles.id to match auth.users.id
-- This allows us to insert arbitrary UUIDs for shadow users.
alter table public.profiles
drop constraint if exists profiles_id_fkey;

-- 2. Update the RLS policy on profiles to allow authenticated users to insert
-- any profile (including shadow profiles for their friends)
drop policy if exists "users can insert own profile" on public.profiles;
drop policy if exists "users can insert profiles" on public.profiles;

create policy "users can insert profiles"
  on public.profiles for insert with check (auth.role() = 'authenticated');
