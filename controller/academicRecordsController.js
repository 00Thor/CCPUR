const pool = require("../config/db");
const { insertAcademicRecord, insertAcademicSubjects,updateCurrentSemester, getCurrentSemester, 
   getSemesterIdByName} = require("../models/academicRecordsModel");

// Get records for a specific student with dynamic filtering and joins
const getRecordsByStudent = async (req, res) => {
  const { student_id } = req.params;

  try {
    // Query to fetch all data for the student using SELECT *
    const query = `
      SELECT *
      FROM academic_records ar
      JOIN semester sem ON ar.semester_id = sem.semester_id
      JOIN academic_subjects sub ON ar.record_id = sub.record_id
      WHERE ar.student_id = $1;
    `;

    // Execute the query
    const result = await pool.query(query, [student_id]);

    // Respond with the data
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No records found for the specified student" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching student records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Insert a new academic record

const addAcademicRecord = async (req, res) => {

  const {
    student_id,
    semester_name, // Passed from the frontend
    subjects, // Array of subjects with grades and marks
    course,
    exam_passed,
    board,
    year,
    division,
  } = req.body;

  if (!student_id || !semester_name || !subjects || subjects.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Fetch the semester_id based on semester_name
    const semester_id = await getSemesterIdByName(semester_name);
    if (!semester_id) {
      return res.status(404).json({ error: "Semester not found" });
    }

    // Insert into academic_records
    const record_id = await insertAcademicRecord({
      student_id,
      semester_id,
      course,
      exam_passed,
      board,
      year,
      division,
    });

    // Insert subjects into academic_subjects
    await insertAcademicSubjects(record_id, subjects);

    // Fetch the student's current_semester
    const current_semester = await getCurrentSemester(student_id);

    // Determine the next semester (limit to 6th semester)
    const semesterMap = {
      "1st Semester": "2nd Semester",
      "2nd Semester": "3rd Semester",
      "3rd Semester": "4th Semester",
      "4th Semester": "5th Semester",
      "5th Semester": "6th Semester",
    };
    const next_semester = semesterMap[current_semester];

    if (next_semester) {
      // Update the student's current_semester in student_details table
      await updateCurrentSemester(student_id, next_semester);
    }

    await client.query("COMMIT"); // Commit transaction

    res.status(201).json({
      message: "Academic record added successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback transaction on error
    console.error("Error adding academic record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// update Academic Records
const updateAcademicRecord = async (req, res) => {
  const { student_id } = req.params;
  const { subjects, course, exam_passed, board, year, division } = req.body; // subjects is an array of { subject, grade, marks }

  if (!subjects || subjects.length === 0) {
    return res.status(400).json({ error: "Subjects data is required" });
  }

  try {
    // Update the academic_records table
    const queryAcademicRecord = `
      UPDATE academic_records
      SET course = $1, exam_passed = $2, board = $3, year = $4, division = $5
      WHERE student_id = $6 RETURNING *;
    `;
    const valuesAcademicRecord = [course, exam_passed, board, year, division, student_id];
    const resultAcademicRecord = await pool.query(queryAcademicRecord, valuesAcademicRecord);

    if (resultAcademicRecord.rows.length === 0) {
      return res.status(404).json({ error: "Academic record not found" });
    }

    // Fetch the record_id of the updated record
    const record_id = resultAcademicRecord.rows[0].record_id;

    // Delete existing subjects for the record_id
    const deleteSubjectsQuery = `
      DELETE FROM academic_subjects
      WHERE record_id = $1;
    `;
    await pool.query(deleteSubjectsQuery, [record_id]);

    // Insert updated subjects into academic_subjects table
    const insertSubjectsQuery = `
      INSERT INTO academic_subjects (record_id, subject, grade, marks)
      VALUES ($1, $2, $3, $4);
    `;
    for (const { subject, grade, marks } of subjects) {
      await pool.query(insertSubjectsQuery, [record_id, subject, grade, marks]);
    }

    res.status(200).json({ message: "Academic record updated successfully" });
  } catch (error) {
    console.error("Error updating academic record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Delete an academic record
const deleteAcademicRecord = async (req, res) => {
  const { student_id } = req.params;

  try {
    const result = await pool.query("DELETE FROM academic_records WHERE student_id = $1 RETURNING *", [student_id]);

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
  getRecordsByStudent,
  addAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord,
};