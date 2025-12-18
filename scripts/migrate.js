const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Running migrations...');

  try {
    const client = await pool.connect();
    
    // Read and execute the SQL migration file
    const sqlFile = path.join(__dirname, '..', 'db', 'migrations', '001_initial_setup.sql');
    
    if (fs.existsSync(sqlFile)) {
      console.log('Executing SQL migration file...');
      const sql = fs.readFileSync(sqlFile, 'utf8');
      await client.query(sql);
      console.log('SQL migration executed successfully!');
    } else {
      console.log('No SQL migration file found, skipping...');
    }
    
    client.release();
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await pool.end();
}

runMigrations();
