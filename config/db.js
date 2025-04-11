// Initialize PostgreSQL database connection
const { Pool } = require('pg');
require('dotenv').config();

// Create a pool of connections
const pool = new Pool({
  user: process.env.PG_USER,         // Your PostgreSQL username
  password: process.env.PG_PASSWORD, // Your PostgreSQL password
  host: process.env.PG_HOST,         // PostgreSQL server host
  port: process.env.PG_PORT || 5432, // PostgreSQL port (default is 5432)
  database: process.env.PG_DATABASE, // Your PostgreSQL database name
  ssl: {
    rejectUnauthorized: false, // Disable strict SSL verification (optional, for development only)
  },
});

module.exports = pool;