-- Add 'pending' status to bookings table
-- Note: SQLite doesn't enforce enum constraints at the database level
-- The enum constraint is enforced at the application level by Drizzle ORM
-- This migration is for documentation purposes

-- The status column already exists with type TEXT
-- Application code now accepts: 'pending', 'confirmed', 'cancelled'
-- Previously only: 'confirmed', 'cancelled'

-- No actual SQL changes needed as SQLite text columns accept any text value
-- The enum validation happens in the application layer via Drizzle schema
