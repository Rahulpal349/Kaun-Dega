-- Run this script in the Supabase SQL Editor to fix missing profiles
-- This inserts a profile row for any existing users in auth.users who 
-- signed up BEFORE you added the trigger to the database.

insert into public.profiles (id, name, email)
select
  id,
  coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  email
from auth.users
where id not in (select id from public.profiles);
