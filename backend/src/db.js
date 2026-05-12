// PostgreSQL Database Connection
const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL (Neon)');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Export query function
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
