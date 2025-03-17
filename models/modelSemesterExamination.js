const pool = require("../config/db");

const semesterExam = async (studentexam) => {
  try {
    const {
      application_for, examination_session, abc_id, registration_no, of_year, roll_no, dept_code,
      course_code, year_semester,
      papercode_a, paperno_a, papercode_b, paperno_b, papercode_c, paperno_c, papercode_d, paperno_d,
      papercode_e, paperno_e, papercode_f, paperno_f, papercode_g, paperno_g, papercode_h, paperno_h,
      papercode_i, paperno_i, papercode_j, paperno_j, exampassed1, board1, year1, roll_no1, division1, subject_taken1,
      exampassed2, board2, year2, roll_no2, division2, subject_taken2, exampassed3, board3, year3, roll_no3,
      division3, subject_taken3, exampassed4, board4, year4, roll_no4, division4, subject_taken4, 
      debarred_exam_name, debarred_year, debarred_rollno, debarred_board
    } = studentexam; 

    const query = `
      INSERT INTO student_examinations (
        application_for, examination_session, abc_id, registration_no, of_year, roll_no, dept_code,
        course_code, year_semester,
        papercode_a, paperno_a, papercode_b, paperno_b, papercode_c, paperno_c, papercode_d, paperno_d,
        papercode_e, paperno_e, papercode_f, paperno_f, papercode_g, paperno_g, papercode_h, paperno_h,
        papercode_i, paperno_i, papercode_j, paperno_j, exampassed1, board1, year1, roll_no1, division1, subject_taken1,
        exampassed2, board2, year2, roll_no2, division2, subject_taken2, exampassed3, board3, year3, roll_no3,
        division3, subject_taken3, exampassed4, board4, year4, roll_no4, division4, subject_taken4, 
        debarred_exam_name, debarred_year, debarred_rollno, debarred_board
      ) VALUES (
        ${Array.from({ length: 55 }, (_, i) => `$${i + 1}`).join(", ")}
      ) RETURNING *;
    `;

    const values = [
      application_for, examination_session, abc_id, registration_no, of_year, roll_no, dept_code,
      course_code, year_semester,
      papercode_a, paperno_a, papercode_b, paperno_b, papercode_c, paperno_c, papercode_d, paperno_d,
      papercode_e, paperno_e, papercode_f, paperno_f, papercode_g, paperno_g, papercode_h, paperno_h,
      papercode_i, paperno_i, papercode_j, paperno_j, exampassed1, board1, year1, roll_no1, division1, subject_taken1,
      exampassed2, board2, year2, roll_no2, division2, subject_taken2, exampassed3, board3, year3, roll_no3,
      division3, subject_taken3, exampassed4, board4, year4, roll_no4, division4, subject_taken4, 
      debarred_exam_name, debarred_year, debarred_rollno, debarred_board
    ];

    // Convert undefined values to NULL for database compatibility
    const safeValues = values.map((val) => (val === undefined ? null : val));

    // Execute the query with the prepared values
    const result = await pool.query(query, safeValues);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting student examination data:", error.message);
    throw error;
  }
};

module.exports = semesterExam;
