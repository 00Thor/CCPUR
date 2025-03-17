const pool = require("../config/db");

// Find faculty by email
const findFacultyByEmail = async (email) => {
  const query = "SELECT * FROM faculty WHERE email = $1";
  const values = [email];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Create new faculty
const createFaculty = async (
  client,
  {
    name,
    email,
    hashedPassword,
    department,
    designation,
    nature_of_appointment,
    engagement,
    phone_number,
    profile_picture,
    date_of_joining,
    teaching_experience,
    address,
    pan_no,
    date_of_birth,
    gender,
    category,
  }
) => {
  const query = `
    INSERT INTO faculty (
      name, email, password, department, designation, nature_of_appointment, 
      engagement, phone_number, profile_picture, date_of_joining, 
      teaching_experience, address, pan_no, date_of_birth, gender, category
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING faculty_id, name, email
  `;
  const values = [
    name,
    email,
    hashedPassword,
    department,
    designation,
    nature_of_appointment,
    engagement,
    phone_number,
    profile_picture,
    date_of_joining,
    teaching_experience,
    address,
    pan_no,
    date_of_birth,
    gender,
    category,
  ];

  const result = await client.query(query, values);
  return result.rows[0];
};

// Upload faculty files
const uploadFacultyFiles = async (client, files, faculty_id) => {
  const query = `
    INSERT INTO faculty_files (faculty_id, profile_photos, books_published, seminars_attended)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (faculty_id) 
    DO UPDATE SET
      profile_photos = faculty_files.profile_photos || EXCLUDED.profile_photos,
      books_published = faculty_files.books_published || EXCLUDED.books_published,
      seminars_attended = faculty_files.seminars_attended || EXCLUDED.seminars_attended
  `;
  const values = [
    faculty_id,
    files.profile_photos || [],
    files.books_published || [],
    files.seminars_attended || [],
  ];

  await client.query(query, values);
};

// Update user's password
const updateFacultyPassword = async (email, hashedPassword) => {
  const query = "UPDATE faculty SET password = $1 WHERE email = $2";
  await pool.query(query, [hashedPassword, email]);
};
module.exports = { findFacultyByEmail, createFaculty, uploadFacultyFiles, updateFacultyPassword };
