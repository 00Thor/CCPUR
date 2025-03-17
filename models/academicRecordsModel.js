const pool = require("../config/db");

// Get semester_id based on semester_name
const getSemesterIdByName = async (semester_name) => {
    const query = "SELECT semester_id FROM semester WHERE semester_name = $1";
    const result = await pool.query(query, [semester_name]);
    return result.rowCount > 0 ? result.rows[0].semester_id : null;
  };
  
  // Insert into academic_records and return the new record_id
  const insertAcademicRecord = async (data) => {
    const query = `
      INSERT INTO academic_records (
        student_id, semester_id, course, exam_passed, board, year, division
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING record_id;
    `;
    const values = [
      data.student_id,
      data.semester_id,
      data.course,
      data.exam_passed,
      data.board,
      data.year,
      data.division,
    ];
    const result = await pool.query(query, values);
    return result.rows[0].record_id;
  };
  
  // Insert multiple subjects for a specific record_id
  const insertAcademicSubjects = async (record_id, subjects) => {
    const queries = subjects.map(({ subject, grade, marks }) => ({
      text: `
        INSERT INTO academic_subjects (record_id, subject, grade, marks)
        VALUES ($1, $2, $3, $4);
      `,
      values: [record_id, subject, grade, marks],
    }));
  
    for (const query of queries) {
      await pool.query(query.text, query.values);
    }
  };

  /* **************** update the student_details ***************************** */
  
  // Fetch the current_semester for a student
const getCurrentSemester = async (student_id) => {
    const query = "SELECT current_semester FROM student_details WHERE student_id = $1";
    const result = await pool.query(query, [student_id]);
    return result.rowCount > 0 ? result.rows[0].current_semester : null;
  };
  
  // Update the current_semester for a student
  const updateCurrentSemester = async (student_id, next_semester) => {
    const query = `
      UPDATE student_details
      SET current_semester = $1
      WHERE student_id = $2;
    `;
    await pool.query(query, [next_semester, student_id]);
  };

module.exports = {
    insertAcademicRecord,
    insertAcademicSubjects,
    getSemesterIdByName,
    getCurrentSemester,
    updateCurrentSemester,
};
