-- Migration: Add helicopter_registration field to bookings
-- Created: 2026-01-12

ALTER TABLE bookings ADD COLUMN helicopter_registration TEXT;

-- Optional: Create an index for faster lookups if needed
-- CREATE INDEX idx_bookings_helicopter_registration ON bookings(helicopter_registration);
