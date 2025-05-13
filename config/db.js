// Initialize PostgreSQL database connection
const { Pool } = require('pg');
require('dotenv').config();

// Create a pool of connections
const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,     
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE,
  ssl: {
    rejectUnauthorized: true, 
  },
});

module.exports = pool;