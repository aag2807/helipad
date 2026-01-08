# Admin Email Configuration

## Overview

The admin email configuration page allows administrators to manage SMTP settings for sending booking notifications directly from the web interface.

## Access

**URL:** `/admin/email`

**Permission:** Admin users only

**Navigation:** 
- Sidebar: Administration → Email Settings
- Mobile menu: Administration → Email Settings

## Features

### 1. SMTP Configuration

Configure your email server settings:

- **Host**: SMTP server hostname (e.g., `smtp.gmail.com`)
- **Port**: SMTP port number (587 for TLS, 465 for SSL, 25 for unencrypted)
- **Secure**: Toggle TLS/SSL encryption (enable for port 465)
- **Username**: SMTP authentication username (usually your email)
- **Password**: SMTP authentication password
  - Show/hide password toggle for security
  - For Gmail: use app passwords (not your regular password)

### 2. Sender Information

Configure how emails appear to recipients:

- **From Email**: The email address that appears as the sender
- **From Name**: The display name for outgoing emails

### 3. Test Email

Send a test email to verify configuration:

1. Enter a test email address
2. Click "Send Test"
3. Check the recipient inbox for the test message

### 4. Configuration Status

Visual indicators:
- **Active Badge**: Shows if the configuration is currently active
- **Form State**: Indicates unsaved changes
- **Provider Info**: Currently configured for SMTP (Resend support coming soon)

## Common SMTP Providers

### Gmail
```
Host: smtp.gmail.com
Port: 587
Secure: No
User: your-email@gmail.com
Password: [App Password from Google Account]
```

**Setup Steps:**
1. Enable 2-Factor Authentication on your Google Account
2. Visit: https://myaccount.google.com/apppasswords
3. Generate an app password
4. Use that password (not your regular Gmail password)

### SendGrid
```
Host: smtp.sendgrid.net
Port: 587
Secure: No
User: apikey
Password: [Your SendGrid API Key]
```

### Mailgun
```
Host: smtp.mailgun.org
Port: 587
Secure: No
User: [Your Mailgun SMTP username]
Password: [Your Mailgun SMTP password]
```

### Amazon SES
```
Host: email-smtp.us-east-1.amazonaws.com
Port: 587
Secure: No
User: [Your SES SMTP username]
Password: [Your SES SMTP password]
```

## Email Types Sent

The system automatically sends emails for:

1. **Booking Confirmation**: When a booking is approved
2. **Booking Cancellation**: When a booking is cancelled or rejected
3. **Booking Reminders**: Upcoming booking notifications (configurable)
4. **Test Emails**: Manual test messages from the settings page

## Security Considerations

1. **Password Storage**: 
   - SMTP passwords are stored in the database
   - Ensure proper database access controls
   - Consider using read-only SMTP credentials

2. **App Passwords**: 
   - For Gmail and similar providers, always use app-specific passwords
   - Never use your main account password

3. **TLS/SSL**: 
   - Always use encrypted connections when possible
   - Port 587 (STARTTLS) or 465 (SSL) recommended

## Troubleshooting

### Test Email Fails

**Problem**: "Failed to send test email"

**Solutions**:
1. Verify SMTP host and port are correct
2. Check username and password
3. For Gmail, ensure:
   - 2FA is enabled
   - Using an app password (not regular password)
4. Check firewall allows outbound SMTP connections
5. Review email logs in the database

### Configuration Not Saving

**Problem**: Changes don't persist

**Solutions**:
1. Check browser console for errors
2. Verify you have admin permissions
3. Ensure database connection is working

### Emails Not Being Sent

**Problem**: No emails received after booking actions

**Solutions**:
1. Check configuration is marked as "Active"
2. Run test email to verify settings
3. Check email logs table for errors
4. Verify recipient email addresses are correct
5. Check spam/junk folders

## Technical Details

### API Endpoints

All endpoints require admin authentication:

- `GET /api/trpc/emailConfig.getCurrent` - Get active configuration
- `GET /api/trpc/emailConfig.getAll` - Get all configurations
- `POST /api/trpc/emailConfig.update` - Update configuration
- `POST /api/trpc/emailConfig.create` - Create new configuration
- `POST /api/trpc/emailConfig.setActive` - Activate a configuration
- `POST /api/trpc/emailConfig.delete` - Delete inactive configuration
- `POST /api/trpc/emailConfig.test` - Send test email

### Database Table

Table: `email_configurations`

Key fields:
- `id` - Unique identifier
- `provider` - Email provider type (smtp, resend)
- `smtp_host` - SMTP server hostname
- `smtp_port` - SMTP server port
- `smtp_secure` - TLS/SSL flag
- `smtp_user` - Authentication username
- `smtp_password` - Authentication password
- `from_email` - Sender email address
- `from_name` - Sender display name
- `is_active` - Active configuration flag

### Real-time Behavior

- Configuration changes take effect immediately
- No application restart required
- Transporter is cached and reloaded when config changes
- Only one configuration can be active at a time

## Future Enhancements

- [ ] Support for Resend API
- [ ] Email template customization
- [ ] Email queue and retry logic
- [ ] Multiple active configurations (fallback support)
- [ ] Email delivery analytics
- [ ] Webhook notifications
