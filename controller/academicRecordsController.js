const pool = require("../config/db");

// Get all academic records
const getAllRecords = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM academic_records");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching academic records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get records for a specific student
const getRecordsByStudent = async (req, res) => {
  const { student_id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM academic_records WHERE student_id = $1", [student_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching student records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add a new academic record
const addRecord = async (req, res) => {
  const { student_id, semester_id, subject, grade, marks, course, exam_passed, board, year, division } = req.body;

  if (!student_id || !semester_id || !subject || !grade || marks === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO academic_records (
        student_id, semester_id, subject, grade, marks, course, exam_passed, board, year, division
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
    `;
    const values = [student_id, semester_id, subject, grade, marks, course, exam_passed, board, year, division];
    const result = await pool.query(query, values);

    res.status(201).json({ message: "Academic record added successfully", record: result.rows[0] });
  } catch (error) {
    console.error("Error adding academic record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update an academic record
const updateRecord = async (req, res) => {
  const { record_id } = req.params;
  const { subject, grade, marks, course, exam_passed, board, year, division } = req.body;

  try {
    const query = `
      UPDATE academic_records
      SET subject = $1, grade = $2, marks = $3, course = $4, exam_passed = $5, board = $6, year = $7, division = $8
      WHERE record_id = $9 RETURNING *;
    `;
    const values = [subject, grade, marks, course, exam_passed, board, year, division, record_id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ message: "Academic record updated successfully", record: result.rows[0] });
  } catch (error) {
    console.error("Error updating academic record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete an academic record
const deleteRecord = async (req, res) => {
  const { record_id } = req.params;

  try {
    const result = await pool.query("DELETE FROM academic_records WHERE record_id = $1 RETURNING *", [record_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ message: "Academic record deleted successfully" });
  } catch (error) {
    console.error("Error deleting academic record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllRecords,
  getRecordsByStudent,
  addRecord,
  updateRecord,
  deleteRecord,
};