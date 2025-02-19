const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

// Insert new user into the database
const createUser = async (name, email, hashedPassword, role = "student", program ) => {
  const query = "INSERT INTO users (name, email, password, role, program) VALUES($1, $2, $3, $4, $5) RETURNING user_id";
  const values = [name, email, hashedPassword, role, program];
  const result = await pool.query(query, values);
  return result.rows[0];
};



// Update user's password
const updateUserPassword = async (email, hashedPassword) => {
  const query = "UPDATE users SET password = $1 WHERE email = $2";
  await pool.query(query, [hashedPassword, email]);
};

module.exports = {
  findUserByEmail,
  createUser,
  updateUserPassword,
};


