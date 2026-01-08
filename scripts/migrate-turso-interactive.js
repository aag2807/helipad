#!/usr/bin/env node

/**
 * Turso Interactive Migration Script
 * 
 * This script lets you interactively apply migrations to Turso
 * and optionally update email configuration
 * 
 * Usage:
 *   npm run migrate:turso
 */

import { createClient } from '@libsql/client';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚁 Helipad Turso Migration Tool\n');

  // Check environment variables
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!databaseUrl || !authToken) {
    console.error('❌ Error: Missing required environment variables');
    console.error('Required: DATABASE_URL, DATABASE_AUTH_TOKEN');
    process.exit(1);
  }

  if (!databaseUrl.startsWith('libsql://')) {
    console.error('❌ Error: DATABASE_URL must be a Turso URL (libsql://...)');
    process.exit(1);
  }

  try {
    // Connect to Turso
    console.log('🔌 Connecting to Turso database...');
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    // Test connection
    await client.execute('SELECT 1');
    console.log('✅ Connected successfully!\n');

    // List available migrations
    const migrationsDir = resolve('migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('📭 No migration files found in ./migrations');
      process.exit(0);
    }

    console.log('📋 Available migrations:');
    migrationFiles.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file}`);
    });

    console.log('\n');
    const answer = await question('Which migration do you want to apply? (number or filename): ');
    
    let selectedFile;
    if (!isNaN(answer)) {
      const index = parseInt(answer) - 1;
      if (index < 0 || index >= migrationFiles.length) {
        console.error('❌ Invalid selection');
        process.exit(1);
      }
      selectedFile = migrationFiles[index];
    } else {
      selectedFile = answer;
    }

    const migrationPath = join(migrationsDir, selectedFile);
    console.log(`\n📄 Reading: ${selectedFile}`);
    const sql = readFileSync(migrationPath, 'utf-8');

    // Show preview
    console.log('\n📝 Migration preview:');
    console.log('─'.repeat(60));
    console.log(sql.substring(0, 300));
    if (sql.length > 300) console.log('...(truncated)');
    console.log('─'.repeat(60));

    const confirm = await question('\n⚠️  Apply this migration? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled');
      process.exit(0);
    }

    // Execute migration
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n⚡ Executing ${statements.length} statement(s)...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   [${i + 1}/${statements.length}] Executing...`);
      
      await client.execute(statement);
      console.log(`   ✅ Success`);
    }

    console.log('\n🎉 Migration completed successfully!');

    // Ask about email configuration
    if (selectedFile.includes('email')) {
      console.log('\n📧 Email Configuration');
      const configureEmail = await question('Do you want to update email settings now? (yes/no): ');
      
      if (configureEmail.toLowerCase() === 'yes') {
        console.log('\nEnter your SMTP details:');
        const smtpHost = await question('  SMTP Host (e.g., smtp.gmail.com): ');
        const smtpPort = await question('  SMTP Port (e.g., 587): ');
        const smtpSecure = await question('  SMTP Secure (yes/no): ');
        const smtpUser = await question('  SMTP User (your email): ');
        const smtpPassword = await question('  SMTP Password: ');
        const fromEmail = await question('  From Email: ');
        const fromName = await question('  From Name: ');

        const updateSql = `
          UPDATE email_configurations 
          SET 
            smtp_host = '${smtpHost}',
            smtp_port = ${smtpPort},
            smtp_secure = ${smtpSecure.toLowerCase() === 'yes' ? 1 : 0},
            smtp_user = '${smtpUser}',
            smtp_password = '${smtpPassword}',
            from_email = '${fromEmail}',
            from_name = '${fromName}',
            updated_at = unixepoch()
          WHERE is_active = 1
        `;

        await client.execute(updateSql);
        console.log('\n✅ Email configuration updated!');
      }
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

main();
