-- Migration: Add security role to users
-- Created: 2026-01-29

-- SQLite doesn't support ALTER TYPE for enum-like TEXT columns
-- But since we're using TEXT with CHECK constraints implicitly via Drizzle,
-- we can just update any existing users and allow the new value

-- Note: In SQLite, TEXT columns don't have actual enum constraints at the DB level
-- unless explicitly created with CHECK constraints. Drizzle handles enum validation
-- at the application level, so this migration is mainly for documentation purposes.

-- No actual schema changes needed - the role column already accepts TEXT values.
-- The new 'security' role will be validated by Drizzle ORM at the application level.
