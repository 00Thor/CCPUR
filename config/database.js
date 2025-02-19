const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,       // Database user
  password: process.env.DB_PASSWORD, // Database password
  host: process.env.DB_HOST,         // Database host
  port: process.env.DB_PORT || 5432, // Database port, default to 5432
  database: process.env.DB_NAME,    // Database name
});

pool
  .connect()
  .then(() => console.log("✅ Database connected successfully."))
  .catch((err) => console.error("❌ Database connection failed:", err));

module.exports = pool;
