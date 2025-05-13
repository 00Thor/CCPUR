const pool = require("../config/db");

const findFacultyByEmail = async (email) => {
  try {
    const query = "SELECT * FROM faculty WHERE email = $1";
    const values = [email];
    result = await pool.query(query, values);
  } catch (error) {
    console.error("Error finding faculty by email:", error.message);
    throw error;
  } 

  return result.rows[0];
};

// Create new faculty
const createFaculty = async (
  client,
  {
    name,
    email,
    hashedPassword,
    designation,
    type,
    engagement,
    contact_number,
    joining_date,
    teaching_experience,
    address,
    date_of_birth,
    gender,
    category,
    academic_qualifications,
    department_id,
  }
) => {
  const query = `
    INSERT INTO faculty (
      name, email, password, designation, type, 
      engagement, contact_number, joining_date, 
      teaching_experience, address, date_of_birth, 
      gender, category, academic_qualifications, department_id
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING faculty_id;
  `;
  const values = [
    name,
    email,
    hashedPassword,
    designation,
    type,
    engagement,
    contact_number,
    joining_date,
    teaching_experience,
    address, 
    date_of_birth,
    gender,
    category,
    academic_qualifications,
    department_id,
  ];
  
  const result = await client.query(query, values);
 
  if (!result.rows[0]?.faculty_id) {
    throw new Error("Failed to retrieve faculty_id after insertion.");
  }

  return result.rows[0];
};

// Update Faculty password
const updateFacultyPassword = async (email, hashedPassword) => {
  const query = "UPDATE faculty SET password = $1 WHERE email = $2";
  await pool.query(query, [hashedPassword, email]);
};

//Inser into Attendance
const insertAttendance = async (attendance) => {
  try {
      const { name, roll_no, date, status } = attendance;

      const query = `INSERT INTO attendance (name, roll_no, date, status) 
                     VALUES ($1, $2, $3, $4) RETURNING *;`;

      const values = [name, roll_no, date, status];
      const result = await pool.query(query, values);

      return result.rows[0];  
  } catch (error) {
      console.error('Error inserting attendance data:', error.message);
      throw error;
  }
};
const teachingStaff = async () => {
  try {
      const result = await pool.query('SELECT * FROM faculty WHERE type = $1', ['teaching']);
      return result.rows;
      
  } catch (error) {
      console.error('Error fetching teaching staff:', error);
      throw error;
  }
};

const nonTeachingStaff = async () => {
  try {
      const result = await pool.query('SELECT * FROM faculty WHERE type = $1', ['non-teaching']);
      return result.rows;
  } catch (error) {
      console.error('Error fetching non-teaching staff:', error);
      throw error;
  }
};

// Delete staff (Admin only)
const deleteFacultyDetails = async (req, res) => {
  try {
      const { faculty_id } = req.params;
      const result = await pool.query('DELETE FROM faculty WHERE faculty_id = $1 RETURNING *', [faculty_id]);

      if (result.rowCount === 0) {
          return res.status(404).json({ success: false, message: 'Faculty member not found' });
      }

      res.json({ success: true, message: 'Faculty deleted successfully', deletedFaculty: result.rows[0] });
  } catch (error) {
      console.error("Error deleting faculty:", error.message);
      res.status(500).json({ success: false, message: 'An error occurred while deleting the faculty member' });
  }
};

// Update staff details dynamically
const updateStaffById = async (staffId, updatedFields) => {
  try {
      const keys = Object.keys(updatedFields).filter(key => updatedFields[key] !== undefined);

      if (keys.length === 0) {
          throw new Error("No fields provided for update");
      }

      // Dynamically build the SET clause (e.g., "name = $1, email = $2")
      const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

      // Values for placeholders
      const values = keys.map(key => updatedFields[key]);
      values.push(staffId);

      const query = `UPDATE faculty SET ${setClause} WHERE faculty_id = $${values.length} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
          throw new Error("Faculty not found");
      }

      return result.rows[0];
  } catch (error) {
      console.error("Error updating staff details:", error.message);
      throw new Error(error.message);
  }
};

const getFacultyById = async (staffId) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.*,
        d.department_id,
        d.department_name,
        d.description AS department_description,
        ar.number_of_journal_published,
        ar.number_of_books_published,
        ar.number_of_books_edited,
        ar.number_of_seminars_attended,
        ar.created_at AS academic_created_at,
        fcr.role_in_committee,
        c.committee_name
      FROM faculty f
      LEFT JOIN department d ON f.department_id = d.department_id
      LEFT JOIN faculty_academic_records ar ON f.faculty_id = ar.faculty_id
      LEFT JOIN faculty_committee_roles fcr ON f.faculty_id = fcr.faculty_id
      LEFT JOIN committee c ON fcr.committee_id = c.committee_id
      WHERE f.faculty_id = $1;
    `, [staffId]);

    if (result.rows.length === 0) {
      throw new Error('No faculty found with the provided ID');
    }

    // Extract common faculty information
    const facultyProfile = {
      faculty_id: result.rows[0].faculty_id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      address: result.rows[0].address,
      contact_number: result.rows[0].contact_number,
      date_of_birth: result.rows[0].date_of_birth 
        ? new Date(result.rows[0].date_of_birth).toISOString().split('T')[0] 
        : null,
      gender: result.rows[0].gender,
      designation: result.rows[0].designation,
      type: result.rows[0].type,
      joining_date: result.rows[0].joining_date 
        ? new Date(result.rows[0].joining_date).toISOString().split('T')[0] 
        : null,
      teaching_experience: result.rows[0].teaching_experience,
      engagement: result.rows[0].engagement,
      category: result.rows[0].category,
      academic_qualifications: result.rows[0].academic_qualifications,
      department: {
        department_name: result.rows[0].department_name,
        department_description: result.rows[0].department_description,
      },
      academicRecords: {
        number_of_journal_published: result.rows[0].number_of_journal_published,
        number_of_books_published: result.rows[0].number_of_books_published,
        number_of_books_edited: result.rows[0].number_of_books_edited,
        number_of_seminars_attended: result.rows[0].number_of_seminars_attended,
        academic_created_at: result.rows[0].academic_created_at,
      },
      committeeRoles: [],
    };

    // Add committee roles
    result.rows.forEach((row) => {
      if (row.role_in_committee && row.committee_name) {
        facultyProfile.committeeRoles.push({
          role_in_committee: row.role_in_committee,
          committee_name: row.committee_name
        });
      }
    });

    return facultyProfile;
  } catch (error) {
    console.error('Error fetching staff:', error.message);
    throw new Error(error.message);
  }
};


module.exports = {   
  teachingStaff,
  nonTeachingStaff,
  insertAttendance,
  deleteFacultyDetails,
  updateStaffById,
  getFacultyById,
  findFacultyByEmail, 
  createFaculty, 
   updateFacultyPassword 
  };
