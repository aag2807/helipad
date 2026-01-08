#!/usr/bin/env node

/**
 * Check Email Configuration in Turso
 * 
 * This script shows the current email configuration
 * 
 * Usage:
 *   npm run check:email
 */

import { createClient } from '@libsql/client';

async function checkEmailConfig() {
  console.log('🚁 Helipad Email Configuration Check\n');

  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!databaseUrl || !authToken) {
    console.error('❌ Error: Missing required environment variables');
    console.error('Required: DATABASE_URL, DATABASE_AUTH_TOKEN');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to database...');
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    // Check if table exists
    const tableCheck = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='email_configurations'"
    );

    if (tableCheck.rows.length === 0) {
      console.log('❌ Email configurations table does not exist');
      console.log('💡 Run: npm run migrate:turso');
      process.exit(1);
    }

    console.log('✅ Connected!\n');

    // Get email configuration
    const result = await client.execute(
      'SELECT * FROM email_configurations WHERE is_active = 1'
    );

    if (result.rows.length === 0) {
      console.log('⚠️  No active email configuration found');
      console.log('💡 Run: npm run migrate:turso to set up');
      process.exit(0);
    }

    const config = result.rows[0];

    console.log('📧 Active Email Configuration:');
    console.log('─'.repeat(60));
    console.log(`Provider:      ${config.provider}`);
    console.log(`SMTP Host:     ${config.smtp_host || '(not set)'}`);
    console.log(`SMTP Port:     ${config.smtp_port || '(not set)'}`);
    console.log(`SMTP Secure:   ${config.smtp_secure ? 'Yes' : 'No'}`);
    console.log(`SMTP User:     ${config.smtp_user ? '✓ (set)' : '❌ (not set)'}`);
    console.log(`SMTP Password: ${config.smtp_password ? '✓ (set)' : '❌ (not set)'}`);
    console.log(`From Email:    ${config.from_email}`);
    console.log(`From Name:     ${config.from_name}`);
    console.log(`Is Active:     ${config.is_active ? 'Yes' : 'No'}`);
    console.log('─'.repeat(60));

    // Check if configuration is complete
    const isComplete = 
      config.smtp_host &&
      config.smtp_port &&
      config.smtp_user &&
      config.smtp_password &&
      config.from_email;

    if (isComplete) {
      console.log('\n✅ Configuration is complete and ready to send emails!');
    } else {
      console.log('\n⚠️  Configuration is incomplete. Missing required fields.');
      console.log('💡 Update with: npm run migrate:turso');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEmailConfig();
