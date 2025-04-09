const pool = require("../config/db");
// CRUD ACADEMIC RECORDS
const createFacultyAcademicRecord = async (client, academicData, faculty_id) => {
  try {
    if (!faculty_id) {
      throw new Error("faculty_id is required.");
    }

    const {
      number_of_journal_published,
      number_of_books_edited,
      number_of_books_published,
      number_of_seminars_attended
    } = academicData;

    const query = `
      INSERT INTO faculty_academic_records (
        faculty_id,
        number_of_journal_published,
        number_of_books_published,
        number_of_books_edited,
        number_of_seminars_attended
      ) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [
      faculty_id,
      number_of_journal_published || null,
      number_of_books_published || null,
      number_of_books_edited || null,
      number_of_seminars_attended || null
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting faculty academic records:", error.message);
    throw new Error("Database insertion failed");
  }
};
  
const updateFacultyAcademicRecords = async (facultyID,recordID, updatefields) => {
    try {
        const keys = Object.keys(updatefields).filter(key => updatefields[key] !== undefined);
        if(keys.length === 0) {
            throw new Error('No fields provided for update');
        }
        //dynamic build setclause for the sql query
        const setClause = keys.map((key, index) => `${key}= $${index+1}`).join(', ');

        //value for plcaeholders
        const values = keys.map(key => updatefields[key]);
        values.push(facultyID, recordID);

        const query = `UPDATE faculty_academic_records SET ${setClause} WHERE faculty_id = $${values.length +1} AND record_id = $${values.length +2} RETURNING *;`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error ("No faculty found");
        }
        return result.rows[0];

    } catch (error){
        console.error('Error updating faculty records', error.message);
        throw new Error("Database insertion failed");
    };
};

// check if already exist
const checkAcademicRecord = async (facultyID) => {
    const query = `SELECT * FROM faculty_academic_records WHERE faculty_id = $1`;
    const result = await pool.query(query, [facultyID]);
    return result.rows.length !== 0; // Returns true if record exists
};

module.exports = {
    createFacultyAcademicRecord,
    updateFacultyAcademicRecords,
    checkAcademicRecord
}