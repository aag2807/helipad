-- Migration: Add Microsoft Graph provider support
-- Date: 2026-01-08

-- Add new columns for Microsoft Graph configuration
ALTER TABLE email_configurations ADD COLUMN azure_tenant_id TEXT;
ALTER TABLE email_configurations ADD COLUMN azure_client_id TEXT;
ALTER TABLE email_configurations ADD COLUMN mailbox_sender TEXT;

-- Note: provider enum is updated in the schema
-- SQLite doesn't support ALTER COLUMN for enum types, 
-- but Drizzle handles the enum constraint at the application level
