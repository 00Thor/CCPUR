const pool = require("../config/db");

const newStudentDetails = async (studentData, client) => {
  try {
    const {
      session, full_name, date_of_birth, aadhaar_no, gender, category, nationality, religion,
      name_of_community, contact_no, blood_group, email, fathers_name, fathers_occupation,
      mothers_name, mothers_occupation, permanent_address, present_address, guardian_name,
      guardian_address, hslc_board, hslc_rollno, hslc_year, hslc_div, hslc_tmarks, hslc_inst,
      classxii_board, classxii_rollno, classxii_year, classxii_div, classxii_tmarks, classxii_inst,
      course, mil, subject, agree, pincode, classxii_stream, user_id
    } = studentData;

    const query = `
      INSERT INTO new_applications (
        session, full_name, date_of_birth, aadhaar_no, gender, category, nationality, religion,
        name_of_community, contact_no, blood_group, email, fathers_name, fathers_occupation,
        mothers_name, mothers_occupation, permanent_address, present_address, guardian_name,
        guardian_address, hslc_board, hslc_rollno, hslc_year, hslc_div, hslc_tmarks, hslc_inst,
        classxii_board, classxii_rollno, classxii_year, classxii_div, classxii_tmarks, classxii_inst,
        course, mil, subject, agree, pincode, classxii_stream, user_id
      ) VALUES (
        $1, $2,TO_DATE($3, 'DD-MM-YYYY'), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
      ) RETURNING application_id, user_id;
    `;
    const values = [
      session || null, full_name || null, date_of_birth || null, aadhaar_no || null, gender || null,
      category || null, nationality || null, religion || null, name_of_community || null,
      contact_no || null, blood_group || null, email || null, fathers_name || null,
      fathers_occupation || null, mothers_name || null, mothers_occupation || null,
      permanent_address || null, present_address || null, guardian_name || null,
      guardian_address || null, hslc_board || null, hslc_rollno || null, hslc_year || null,
      hslc_div || null, hslc_tmarks || null, hslc_inst || null, classxii_board || null,
      classxii_rollno || null, classxii_year || null, classxii_div || null, classxii_tmarks || null,
      classxii_inst || null, course || null, mil || null, subject || null, agree || null,
      pincode || null, classxii_stream || null, user_id
    ];

    const result = await client.query(query, values);
    return result.rows[0]; // Return the inserted student data
  } catch (error) {
    console.error("Error inserting student data:", error.message);
    throw error;
  }
};


// Approve student insert to student table

const approvedStd = async (approvedStudents, client) => {
  try {
    const {
      session, full_name, date_of_birth, aadhaar_no, gender, category, nationality, religion,
      name_of_community, contact_no, blood_group, email, fathers_name, fathers_occupation,
      mothers_name, mothers_occupation, permanent_address, present_address, guardian_name,
      guardian_address, hslc_board, hslc_rollno, hslc_year, hslc_div, hslc_tmarks, hslc_inst,
      classxii_board, classxii_rollno, classxii_year, classxii_div, classxii_tmarks, classxii_inst,
      course, mil, subject, user_id, agree, pincode, classxii_stream
    } = approvedStudents;

    const query = `
      INSERT INTO student_details (
        session, full_name, date_of_birth, aadhaar_no, gender, category, nationality, religion,
        name_of_community, contact_no, blood_group, email, fathers_name, fathers_occupation,
        mothers_name, mothers_occupation, permanent_address, present_address, guardian_name,
        guardian_address, hslc_board, hslc_rollno, hslc_year, hslc_div, hslc_tmarks, hslc_inst,
        classxii_board, classxii_rollno, classxii_year, classxii_div, classxii_tmarks, classxii_inst,
        course, mil, subject, user_id, agree, pincode, classxii_stream
      ) VALUES (                  
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
      ) RETURNING *;
    `;

    const values = [
      session, full_name, date_of_birth, aadhaar_no, gender, category, nationality, religion,
      name_of_community, contact_no, blood_group, email, fathers_name, fathers_occupation,
      mothers_name, mothers_occupation, permanent_address, present_address, guardian_name,
      guardian_address, hslc_board, hslc_rollno, hslc_year, hslc_div, hslc_tmarks, hslc_inst,
      classxii_board, classxii_rollno, classxii_year, classxii_div, classxii_tmarks, classxii_inst,
      course, mil, subject, user_id, agree, pincode, classxii_stream
    ];

    const result = await client.query(query, values);
    return result.rows[0]; 

  } catch (error) {
    console.error("Error inserting student data:", error.message);
    throw error;
  }
};
module.exports = { newStudentDetails, approvedStd };
