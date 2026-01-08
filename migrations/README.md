# Turso Database Migrations

This directory contains SQL migration files for the Turso production database.

## 📋 Migration Files

- `0003_add_email_configurations.sql` - Adds email configuration table for Nodemailer

## 🚀 How to Apply Migrations to Turso

### Option 1: Interactive Migration (Recommended)

The interactive script guides you through the migration process:

```bash
npm run migrate:turso
```

This will:
1. List all available migrations
2. Let you select which one to apply
3. Show a preview of the SQL
4. Ask for confirmation
5. Execute the migration
6. Optionally configure email settings

### Option 2: Direct Migration

Apply a specific migration file directly:

```bash
npm run migrate:turso:file migrations/0003_add_email_configurations.sql
```

## 🔐 Required Environment Variables

Make sure these are set in your production environment:

```bash
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-turso-auth-token
```

## 📧 Email Configuration

After running the email configuration migration, you need to update the SMTP settings:

### Via Interactive Script

Run `npm run migrate:turso` and follow the prompts to configure email.

### Via Turso CLI

```bash
turso db shell your-database-name
```

```sql
UPDATE email_configurations 
SET 
  smtp_host = 'smtp.gmail.com',
  smtp_port = 587,
  smtp_secure = 0,
  smtp_user = 'your-email@gmail.com',
  smtp_password = 'your-app-password',
  from_email = 'noreply@yourapp.com',
  from_name = 'Your App Name',
  updated_at = unixepoch()
WHERE is_active = 1;
```

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use these settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Secure: `0` (false)
   - User: Your Gmail address
   - Password: Generated app password

## 🔍 Verify Migration

After applying the migration, verify the table exists:

```bash
turso db shell your-database-name
```

```sql
-- Check if table exists
SELECT name FROM sqlite_master WHERE type='table' AND name='email_configurations';

-- View configuration
SELECT id, provider, smtp_host, smtp_port, from_email, is_active FROM email_configurations;
```

## 🛠️ Manual Migration (Alternative)

If you prefer to use the Turso CLI directly:

1. Copy the SQL from `migrations/0003_add_email_configurations.sql`
2. Connect to your database:
   ```bash
   turso db shell your-database-name
   ```
3. Paste and execute the SQL
4. Update the email settings with your credentials

## 📝 Notes

- Migrations are **not** automatically applied
- Always backup your data before running migrations
- Test migrations in a staging environment first
- The email configuration table supports multiple configurations, but only one can be active at a time
- SMTP passwords are stored in plaintext - ensure proper database access controls

## 🆘 Troubleshooting

### Connection Error
```
❌ Error: Missing required environment variables
```
**Solution**: Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in your environment.

### Invalid URL
```
❌ Error: DATABASE_URL must be a Turso URL
```
**Solution**: Ensure your URL starts with `libsql://`

### Table Already Exists
```
❌ Error: table email_configurations already exists
```
**Solution**: Migration already applied! You can verify with:
```sql
SELECT * FROM email_configurations;
```
