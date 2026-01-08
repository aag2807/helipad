#!/usr/bin/env node

/**
 * Turso Migration Script
 * 
 * This script applies SQL migrations to your Turso database
 * 
 * Usage:
 *   node scripts/migrate-turso.js <migration-file>
 * 
 * Example:
 *   node scripts/migrate-turso.js migrations/0003_add_email_configurations.sql
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: Your Turso database URL (libsql://...)
 *   - DATABASE_AUTH_TOKEN: Your Turso authentication token
 */

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function migrate() {
  // Get migration file from command line
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('❌ Error: Please provide a migration file path');
    console.error('Usage: node scripts/migrate-turso.js <migration-file>');
    console.error('Example: node scripts/migrate-turso.js migrations/0003_add_email_configurations.sql');
    process.exit(1);
  }

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
    // Read migration file
    const migrationPath = resolve(migrationFile);
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const sql = readFileSync(migrationPath, 'utf-8');

    // Create Turso client
    console.log(`🔌 Connecting to Turso database...`);
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statement(s) to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 60)}...`);
      
      await client.execute(statement);
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
