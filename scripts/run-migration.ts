import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.EXTERNAL_DATABASE_URL,
  });

  try {
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '001_initial_setup.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running migration...');
    await pool.query(sql);
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
