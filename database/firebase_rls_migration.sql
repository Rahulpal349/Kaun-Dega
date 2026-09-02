-- =====================================================================================
-- FIREBASE AUTH COMPATIBILITY MIGRATION SCRIPT
-- =====================================================================================
-- Run this in your Supabase SQL Editor to allow Firebase Auth users to work with your database.
-- 
-- 1. Drops the strict foreign key constraint that requires a profile ID to exist in auth.users
-- 2. Disables the strict Row Level Security (RLS) policies so "Anonymous" Firebase users
--    can read and write their own data using the UUID sent from the frontend.

-- Drop the auth.users foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- For a prototype combining Firebase Auth and Supabase DB without edge functions,
-- the simplest way to allow access is to disable RLS so that the 'anon' role can access the tables.
-- The frontend now passes the deterministic UUID in the requests.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements DISABLE ROW LEVEL SECURITY;

-- Grant access to the anonymous role since Firebase users won't have a Supabase JWT
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.groups TO anon;
GRANT ALL ON public.group_members TO anon;
GRANT ALL ON public.expenses TO anon;
GRANT ALL ON public.expense_shares TO anon;
GRANT ALL ON public.settlements TO anon;

-- Note: In a production environment, you would want to either:
-- a) Move back to Supabase Auth completely.
-- b) Create a Supabase Edge Function to verify the Firebase JWT and apply RLS.
-- c) Migrate fully to Firebase Firestore.
-- This script is a temporary workaround to get you unblocked immediately for prototyping.
