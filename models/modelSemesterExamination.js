const pool = require("../config/db");


const studentExamination = async (studentexam) => {
  try {
    const {
      application_for, examination_session, ABC_id, registration_no, of_year, roll_no, dept_code,
      fathers_name, guardian_name, permanent_address, course_code, year_semester, sex, category,
      papercode_a, paperno_a, papercode_b, paperno_b, papercode_c, paperno_c, papercode_d, paperno_d,
      papercode_e, paperno_e, papercode_f, paperno_f, papercode_g, paperno_g, papercode_h, paperno_h,
      papercode_i, paperno_i, papercode_j, paperno_j, exampassed1, board1, year1, roll_no1, division1, subject_taken1,
      exampassed2, board2, year2, roll_no2, division2, subject_taken2, exampassed3, board3, year3, roll_no3,
      division3, subject_taken3, exampassed4, board4, year4, roll_no4, division4, subject_taken4, 
      debarred_exam_name, debarred_year, debarred_rollno, debarred_board
    } = studentexam; 

    const query = `
      INSERT INTO semester_examinations (
        application_for, examination_session, ABC_id, registration_no, of_year, roll_no, dept_code,
        fathers_name, guardian_name, permanent_address, course_code, year_semester, sex, category,
        papercode_a, paperno_a, papercode_b, paperno_b, papercode_c, paperno_c, papercode_d, paperno_d,
        papercode_e, paperno_e, papercode_f, paperno_f, papercode_g, paperno_g, papercode_h, paperno_h,
        papercode_i, paperno_i, papercode_j, paperno_j, exampassed1, board1, year1, roll_no1, division1, subject_taken1,
        exampassed2, board2, year2, roll_no2, division2, subject_taken2, exampassed3, board3, year3, roll_no3,
        division3, subject_taken3, exampassed4, board4, year4, roll_no4, division4, subject_taken4, 
        debarred_exam_name, debarred_year, debarred_rollno, debarred_board
      ) VALUES (
        ${Array.from({ length: 62 }, (_, i) => `$${i + 1}`).join(", ")}
      ) RETURNING *;
    `;

    const values = [
      application_for, examination_session, ABC_id, registration_no, of_year, roll_no, dept_code,
      fathers_name, guardian_name, permanent_address, course_code, year_semester, sex, category,
      papercode_a, paperno_a, papercode_b, paperno_b, papercode_c, paperno_c, papercode_d, paperno_d,
      papercode_e, paperno_e, papercode_f, paperno_f, papercode_g, paperno_g, papercode_h, paperno_h,
      papercode_i, paperno_i, papercode_j, paperno_j, exampassed1, board1, year1, roll_no1, division1, subject_taken1,
      exampassed2, board2, year2, roll_no2, division2, subject_taken2, exampassed3, board3, year3, roll_no3,
      division3, subject_taken3, exampassed4, board4, year4, roll_no4, division4, subject_taken4, 
      debarred_exam_name, debarred_year, debarred_rollno, debarred_board
    ];

    // Convert undefined values to NULL
    const safeValues = values.map(val => val === undefined ? null : val);

    console.log("QUERY:", query);
    console.log("Number of Columns:", query.match(/\w+/g).length - 2);
    console.log("Number of Values:", safeValues.length);
    console.log("VALUES:", safeValues);

    const result = await pool.query(query, safeValues);
    return result.rows[0];

  } catch (error) {
    console.error("Error inserting student data:", error);
    throw error;
  }
};

module.exports = studentExamination;
