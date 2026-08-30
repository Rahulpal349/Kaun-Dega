-- Initialize the schema correctly for Production / Database Checks
-- This script ensures tables are created correctly if Hibernate validate is used
-- Note: In a true production environment, Flyway or Liquibase is highly recommended.

-- Create extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    profile_picture VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- GROUP MEMBERS TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL,
    paid_by UUID NOT NULL,
    amount NUMERIC(38, 2) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- SPLITS TABLE
CREATE TABLE IF NOT EXISTS splits (
    id UUID PRIMARY KEY,
    expense_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount NUMERIC(38, 2) NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL,
    from_user UUID NOT NULL,
    to_user UUID NOT NULL,
    amount NUMERIC(38, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE RESTRICT
);

-- INDEXES
-- It is highly recommended to index foreign keys and commonly searched columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_splits_expense_id ON splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_transactions_group_id ON transactions(group_id);
