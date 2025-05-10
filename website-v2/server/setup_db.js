'use strict';

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool specifically for this script
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'cs_rankings',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// Run an SQL file
const runSQLFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, 'sql', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Running SQL file: ${filename}`);
    await pool.query(sql);
    console.log(`Successfully executed: ${filename}`);
    
    return true;
  } catch (error) {
    console.error(`Error executing ${filename}:`, error);
    return false;
  }
};

// Setup database function
const setupDatabase = async () => {
  try {
    console.log('Starting database setup...');
    
    // Run schema script
    const schemaCreated = await runSQLFile('create_tables.sql');
    if (!schemaCreated) {
      console.error('Failed to create schema. Exiting...');
      process.exit(1);
    }
    
    // Run seed data script
    const dataSeed = await runSQLFile('seed_data.sql');
    if (!dataSeed) {
      console.error('Failed to seed data. Exiting...');
      process.exit(1);
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Run the setup
setupDatabase();