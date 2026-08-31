-- ==============================================================================
-- DATABASE PERFORMANCE INDEXES
-- ==============================================================================
-- These indexes resolve slow query times by ensuring the database doesn't
-- have to scan entire tables when filtering by foreign keys or dates.

-- 1. EXPENSES
-- We frequently query expenses by group, and sometimes filter by time.
CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);

-- 2. SPLITS
-- When calculating balances, we query splits by user and expense.
CREATE INDEX idx_splits_user_id ON splits(user_id);
CREATE INDEX idx_splits_expense_id ON splits(expense_id);

-- 3. TRANSACTIONS
-- Transactions are filtered by group and status, or by the involved users.
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_group_status ON transactions(group_id, status);
CREATE INDEX idx_transactions_users ON transactions(from_user, to_user);

-- 4. GROUP_MEMBERS (Join Table)
-- Hibernate manages this, but we should ensure there's a covering index
-- (often created automatically by the database for primary keys, but good to ensure)
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
