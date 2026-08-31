-- ============================================================
-- Fix: Add UPDATE and DELETE policies for expenses & expense_shares
-- Run this in Supabase SQL Editor
-- ============================================================

-- Allow group members to UPDATE expenses (e.g. change payer)
drop policy if exists "members can update expenses" on expenses;
create policy "members can update expenses"
  on expenses for update using (
    public.is_group_member(group_id)
  );

-- Allow group members to DELETE expenses
drop policy if exists "members can delete expenses" on expenses;
create policy "members can delete expenses"
  on expenses for delete using (
    public.is_group_member(group_id)
  );

-- Allow group members to DELETE expense shares
drop policy if exists "members can delete expense shares" on expense_shares;
create policy "members can delete expense shares"
  on expense_shares for delete using (
    exists (
      select 1 from expenses e
      where e.id = expense_shares.expense_id and public.is_group_member(e.group_id)
    )
  );
