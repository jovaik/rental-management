#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates a backup of the PostgreSQL database using pg_dump.
 * Backups are stored in /backups directory with timestamp.
 * 
 * Usage:
 *   npm run db:backup
 *   node scripts/backup-database.js
 * 
 * Requirements:
 *   - PostgreSQL client (pg_dump) must be installed
 *   - DATABASE_URL must be set in environment
 */

const { exec } = require('child_process');
const { mkdir } = require('fs/promises');
const { join } = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Parse connection string
function parseConnectionString(url) {
  try {
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?.*)?$/;
    const match = url.match(regex);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5].split('?')[0],
    };
  } catch (error) {
    console.error('❌ Error parsing DATABASE_URL:', error.message);
    process.exit(1);
  }
}

async function backupDatabase() {
  console.log('🗄️  Starting database backup...\n');

  const db = parseConnectionString(DATABASE_URL);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(process.cwd(), 'backups');
  const backupFile = join(backupDir, `backup-${db.database}-${timestamp}.sql`);

  try {
    // Create backups directory if it doesn't exist
    await mkdir(backupDir, { recursive: true });

    console.log('📦 Database Information:');
    console.log(`   Host: ${db.host}`);
    console.log(`   Port: ${db.port}`);
    console.log(`   Database: ${db.database}`);
    console.log(`   User: ${db.user}`);
    console.log(`\n💾 Backup file: ${backupFile}\n`);

    // Run pg_dump
    const command = `PGPASSWORD="${db.password}" pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -F p -f "${backupFile}"`;
    
    await execAsync(command);

    // Get file size
    const { stdout: sizeOutput } = await execAsync(`du -h "${backupFile}" | cut -f1`);
    const fileSize = sizeOutput.trim();

    console.log('✅ Backup completed successfully!');
    console.log(`📁 File: ${backupFile}`);
    console.log(`📏 Size: ${fileSize}`);
    console.log('\n💡 To restore this backup, run:');
    console.log(`   psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} < "${backupFile}"`);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    if (error.message.includes('pg_dump: command not found')) {
      console.error('\n💡 PostgreSQL client is not installed.');
      console.error('   Install it with:');
      console.error('   - Ubuntu/Debian: sudo apt-get install postgresql-client');
      console.error('   - macOS: brew install postgresql');
      console.error('   - Windows: Download from https://www.postgresql.org/download/');
    }
    
    process.exit(1);
  }
}

// Run backup
backupDatabase();
