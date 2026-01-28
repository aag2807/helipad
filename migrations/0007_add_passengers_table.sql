-- Migration: Add passengers table and remove passengers count
-- Created: 2026-01-22

-- Create passengers table
CREATE TABLE IF NOT EXISTS passengers (
  id TEXT PRIMARY KEY NOT NULL,
  booking_id TEXT NOT NULL,
  name TEXT NOT NULL,
  identification_type TEXT NOT NULL, -- 'cedula' or 'passport'
  identification_number TEXT NOT NULL,
  id_photo TEXT, -- Base64 encoded photo (optional)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Create index for faster lookups by booking
CREATE INDEX idx_passengers_booking_id ON passengers(booking_id);

-- Remove the old passengers count column from bookings
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- This will be handled in the schema, but the column can be left as-is for backward compatibility
-- during migration. After confirming all works, we can clean it up.

-- For now, we'll just add a comment that this field is deprecated
-- The schema.ts will define the new structure
