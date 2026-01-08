-- Migration: Add passengers field to bookings
-- Created: 2026-01-08

-- Add passengers column with default value of 1
ALTER TABLE bookings ADD COLUMN passengers INTEGER NOT NULL DEFAULT 1;
