const pool = require("../config/db");

const findStaffByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM faculty WHERE email = $1", [email]);
  return result.rows[0];
};

// Insert new user into the database
const createFaculty = async (name, email, hashedPassword, role = "staff", ) => {
  const query = "INSERT INTO faculty (name, email, password, role, program) VALUES($1, $2, $3, $4, $5) RETURNING user_id";
  const values = [name, email, hashedPassword, role ];
  const result = await pool.query(query, values);
  return result.rows[0];
};


// Update user's password
const updateStaffPassword = async (email, hashedPassword) => {
  const query = "UPDATE faculty SET password = $1 WHERE email = $2";
  await pool.query(query, [hashedPassword, email]);
};

module.exports = {
  findStaffByEmail,
  updateStaffPassword,
};


