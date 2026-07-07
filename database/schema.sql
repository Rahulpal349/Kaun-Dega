-- ============================================================
-- Kaun Dega? — Database Schema (Supabase / Postgres)
-- ============================================================
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- Profiles: one row per authenticated user, mirrors auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text, -- used to build wa.me links
  created_at timestamptz default now()
);

-- Groups: a "trip" / "flat" / "circle" of people who split expenses
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text default '🧾',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Membership: who belongs to which group
create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Expenses: one bill/chit
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  description text not null,
  amount numeric(10, 2) not null,
  paid_by uuid references profiles(id) on delete set null,
  split_type text not null default 'equal', -- 'equal' | 'custom'
  created_at timestamptz default now()
);

-- Expense shares: how an expense is split across members
-- For 'equal' splits, these rows are generated automatically.
-- For 'custom' splits, the client supplies exact share amounts.
create table if not exists expense_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  share_amount numeric(10, 2) not null
);

-- Settlements: records of "X paid Y ₹Z to settle up"
create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  from_user uuid references profiles(id) on delete set null,
  to_user uuid references profiles(id) on delete set null,
  amount numeric(10, 2) not null,
  settled_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_shares enable row level security;
alter table settlements enable row level security;

-- Profiles: users can read any profile (needed to show names in a group),
-- but only edit their own.
drop policy if exists "profiles are readable by authenticated users" on profiles;
create policy "profiles are readable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');
drop policy if exists "users can update own profile" on profiles;
create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);
drop policy if exists "users can insert own profile" on profiles;
create policy "users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Helper function to check group membership without triggering infinite recursion
create or replace function public.is_group_member(target_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = target_group_id and gm.user_id = auth.uid()
  );
$$ language sql security definer;

-- Groups: only members can see/manage a group
drop policy if exists "members can view their groups" on groups;
create policy "members can view their groups"
  on groups for select using (
    public.is_group_member(id) or auth.uid() = created_by
  );
drop policy if exists "authenticated users can create groups" on groups;
create policy "authenticated users can create groups"
  on groups for insert with check (auth.uid() = created_by);

-- Group members: only members can see the member list; only members can add others
drop policy if exists "members can view membership" on group_members;
create policy "members can view membership"
  on group_members for select using (
    public.is_group_member(group_id)
  );
drop policy if exists "members can add to their group" on group_members;
create policy "members can add to their group"
  on group_members for insert with check (
    public.is_group_member(group_id)
    or user_id = auth.uid()
  );

-- Expenses: only group members can view/add
drop policy if exists "members can view expenses" on expenses;
create policy "members can view expenses"
  on expenses for select using (
    public.is_group_member(group_id)
  );
drop policy if exists "members can add expenses" on expenses;
create policy "members can add expenses"
  on expenses for insert with check (
    public.is_group_member(group_id)
  );

-- Expense shares: only group members can view or insert (inserted directly from the
-- frontend now that there's no separate backend service to hold a service-role key)
drop policy if exists "members can view expense shares" on expense_shares;
create policy "members can view expense shares"
  on expense_shares for select using (
    exists (
      select 1 from expenses e
      where e.id = expense_shares.expense_id and public.is_group_member(e.group_id)
    )
  );

drop policy if exists "members can insert expense shares" on expense_shares;
create policy "members can insert expense shares"
  on expense_shares for insert with check (
    exists (
      select 1 from expenses e
      where e.id = expense_shares.expense_id and public.is_group_member(e.group_id)
    )
  );

-- Settlements: only group members can view/add
drop policy if exists "members can view settlements" on settlements;
create policy "members can view settlements"
  on settlements for select using (
    public.is_group_member(group_id)
  );
drop policy if exists "members can add settlements" on settlements;
create policy "members can add settlements"
  on settlements for insert with check (
    public.is_group_member(group_id)
  );

-- Auto-create a profile row whenever someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
