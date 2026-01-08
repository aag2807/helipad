-- Migration: Add email_configurations table
-- Created: 2026-01-07

CREATE TABLE IF NOT EXISTS email_configurations (
  id TEXT PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL DEFAULT 'smtp',
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_secure INTEGER DEFAULT 1,
  smtp_user TEXT,
  smtp_password TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  resend_api_key TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert default configuration (update values as needed)
INSERT INTO email_configurations (
  id,
  provider,
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_user,
  smtp_password,
  from_email,
  from_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))),
  'smtp',
  'smtp.gmail.com',
  587,
  0,
  'your-email@gmail.com',
  'your-app-password',
  'noreply@helipad.local',
  'Helipad Booking',
  1,
  unixepoch(),
  unixepoch()
);

-- Note: Remember to update the smtp_user and smtp_password with your actual credentials
