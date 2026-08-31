-- ============================================================
-- Add invite_code column + function + trigger to groups table
-- Also add RLS policies for joining via invite link
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add invite_code column
alter table groups add column if not exists invite_code text unique;

-- 2. Function to generate a random 6-char alphanumeric code
create or replace function public.generate_invite_code()
returns trigger as $$
declare
  new_code text;
  done bool := false;
begin
  while not done loop
    -- Generate 6-char code from uppercase letters and digits
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    -- Check uniqueness
    done := not exists (select 1 from groups where invite_code = new_code);
  end loop;
  new.invite_code := new_code;
  return new;
end;
$$ language plpgsql;

-- 3. Trigger: auto-generate invite_code on INSERT (only if not already set)
drop trigger if exists set_invite_code on groups;
create trigger set_invite_code
  before insert on groups
  for each row
  when (new.invite_code is null)
  execute function public.generate_invite_code();

-- 4. Backfill existing groups that don't have an invite_code yet
update groups
set invite_code = upper(substr(md5(random()::text || id::text), 1, 6))
where invite_code is null;

-- 5. RLS: Allow any authenticated user to read a group by invite_code
--    (needed so the /join page can show the group name before joining)
drop policy if exists "anyone can view group by invite code" on groups;
create policy "anyone can view group by invite code"
  on groups for select using (
    invite_code is not null and auth.role() = 'authenticated'
  );

-- 6. RLS: Allow any authenticated user to add THEMSELVES to a group
--    (needed for the "Join" button — they insert their own membership row)
drop policy if exists "anyone can join a group via invite" on group_members;
create policy "anyone can join a group via invite"
  on group_members for insert with check (
    user_id = auth.uid()
  );
