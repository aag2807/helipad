-- Migration: Rename id_photo to id_photo_base64 in passengers table
-- Created: 2026-01-28

-- SQLite doesn't support RENAME COLUMN directly in older versions
-- We need to recreate the table with the correct column name

-- Step 1: Create new table with correct column name
CREATE TABLE IF NOT EXISTS passengers_new (
  id TEXT PRIMARY KEY NOT NULL,
  booking_id TEXT NOT NULL,
  name TEXT NOT NULL,
  identification_type TEXT NOT NULL,
  identification_number TEXT NOT NULL,
  id_photo_base64 TEXT, -- Base64 encoded photo (optional)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Step 2: Copy data from old table to new table
INSERT INTO passengers_new (id, booking_id, name, identification_type, identification_number, id_photo_base64, created_at, updated_at)
SELECT id, booking_id, name, identification_type, identification_number, id_photo, created_at, updated_at
FROM passengers;

-- Step 3: Drop old table
DROP TABLE passengers;

-- Step 4: Rename new table to original name
ALTER TABLE passengers_new RENAME TO passengers;

-- Step 5: Recreate index
CREATE INDEX idx_passengers_booking_id ON passengers(booking_id);
