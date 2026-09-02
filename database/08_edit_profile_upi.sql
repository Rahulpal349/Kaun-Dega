-- Migration: Ensure upi_id exists on profiles table for settlement feature

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;

-- Ensure users can update their own profile (in case policies are missing)
DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- No trigger update needed here if we rely on frontend sending the data directly to the profiles table.
