-- ==============================================================================
-- Kaun Dega - Database Index Optimization Script
-- ==============================================================================

-- 1. Optimize Expense Fetching
-- When loading a group's expenses, we almost always order by created_at.
-- This compound index dramatically speeds up the Expense feed.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_group_created ON expenses(group_id, created_at DESC);

-- 2. Optimize Balance Calculation & Split Fetching
-- Balance calculations constantly search for splits involving a specific user across specific expenses.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_splits_user_expense ON splits(user_id, expense_id);

-- 3. Optimize Settlement / Transaction Lookups
-- Filtering transactions by timeframe (e.g., this month) and status.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_timeframe ON transactions(group_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status ON transactions(group_id, status);

-- 4. Foreign Key Constraints (Basic Indexes)
-- Typically, postgres does NOT automatically index foreign keys. 
-- Ensure these exist if not already present from init-schema.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_from_user ON transactions(from_user);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_to_user ON transactions(to_user);
