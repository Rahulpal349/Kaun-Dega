-- Migration: Add extra profile fields (upi_id, gender) and update the auth trigger

-- 1. Add new columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;

-- Note: the 'phone' column already exists in the original schema

-- 2. Update the trigger function to capture these fields from raw_user_meta_data during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, upi_id, gender)
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'upi_id',
    new.raw_user_meta_data->>'gender'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
