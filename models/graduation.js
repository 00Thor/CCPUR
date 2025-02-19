const pool = require('../config/db');

// Archive a student to Graduation(alumini)
const archiveStudent = async (name, email, hashedPassword, role = "student", program = null) => {
    const query = "INSERT INTO users (name, email, password, role, program) VALUES($1, $2, $3, $4, $5) RETURNING user_id";
    const values = [name, email, hashedPassword, role, program];
    const result = await pool.query(query, values);
    return result.rows[0];
  };
  

module.exports = { archiveStudent };