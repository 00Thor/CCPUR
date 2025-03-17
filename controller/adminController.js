const { getStudentByIdFromDB, updateStudentById, deletingStudent, getLatestAdmittedStudents} = require('../models/adminModels');
const { updateStaffById} = require('../models/facultyInfoModels')
const pool = require('../config/db'); // Import the pool


// Get a single student by user_id
async function getStudentById(req, res) {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        const result = await getStudentByIdFromDB(user_id);

        if (!result) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Controller function to fetch all students
async function getAllStudentsDetails(req, res) {
  try {
    // SQL query to fetch all students
    const result = await pool.query('SELECT * FROM student_details');
    res.json(result.rows); // Return the result to the client
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: error.message }); // Handle any errors
  }
}

// Get all faculty/staff details
const getStaffDetails = async (req, res) => {
    try {
        // Query to fetch all records
        const query = 'SELECT * FROM faculty';
        const result = await pool.query(query);

        // Return all rows
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching staff details:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Delete Student by Roll Number or Aadhaar Number
const deleteStudent = async (req, res) => {
    try {
        const { identifier } = req.params; // Identifier could be roll_no or aadhaar_no

        const student = await deletingStudent(identifier);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json({ success: true, message: 'Student deleted successfully', student });
    } catch (error) {
        console.error("Error deleting student:", error.message);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the student' });
    }
};

// Update Student Details (Dynamic Update)
const updateStudent = async (req, res) => {
    try {
        const { user_id } = req.params; // Identifier could be roll_no or aadhaar_no
        const updatedFields = req.body;

        // Validate inputs
        if (!user_id || Object.keys(updatedFields).length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid input: user_id or fields missing' });
        }

        const updatedStudent = await updateStudentById(user_id, updatedFields);

        if (!updatedStudent) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json({ success: true, message: 'Student updated successfully', updatedStudent });
    } catch (error) {
        console.error("Error updating student:", error.message);
        res.status(500).json({ success: false, message: 'An error occurred while updating the student' });
    }
};

//Approve applicant
const approveApplicant = async (req, res) => {
    const { application_id } = req.params;

    try {
        const moveQuery = `
            WITH moved_student AS (
                INSERT INTO students (name, email, aadhaar_no, program)
                SELECT name, email, aadhaar_no, program FROM applications
                WHERE application_id = $1
                RETURNING *
            )
            DELETE FROM applications WHERE application_id = $1 RETURNING *;
        `;

        const result = await pool.query(moveQuery, [application_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Application not found or already processed" });
        }

        res.json({ success: true, message: "Application approved", student: result.rows[0] });
    } catch (error) {
        console.error("Error approving application:", error.message);
        res.status(500).json({ success: false, message: "Error processing application" });
    }
};

//Reject Applicant
const rejectApplicant = async (req, res) => {
    const { application_id } = req.params;

    try {
        const result = await pool.query(
            'UPDATE applications SET application_status = $1 WHERE application_id = $2 RETURNING *',
            ['rejected', application_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Application not found or already processed" });
        }

        res.json({ success: true, message: "Application rejected", application: result.rows[0] });
    } catch (error) {
        console.error("Error rejecting application:", error.message);
        res.status(500).json({ success: false, message: "Error processing application" });
    }
};
// Get latest admitted students

const getLatestStudents = async (req, res) => {
    try {
        const students = await getLatestAdmittedStudents(); // Already returns rows

        if (!students || students.length === 0) {
            return res.status(404).json({ message: 'No recently admitted students found' });
        }

        res.status(200).json(students); // Return the list of students
    } catch (error) {
        console.error('Error fetching latest admitted students:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update Staff Details (Dynamic Update)
const updateStaffDetails = async (req, res) => {
    try {
        const { identifier } = req.params; // Identifier could be roll_no or aadhaar_no
        const updatedFields = req.body;

        const updatedstaff = await updateStaffById(identifier, updatedFields);

        if (!updatedstaff) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }

        res.json({ success: true, message: 'Faculty detail updated successfully', updatedstaff });
    } catch (error) {
        console.error("Error updating student:", error.message);
        res.status(500).json({ success: false, message: 'An error occurred while updating the staff details' });
    }
};


module.exports = { getStudentById, getAllStudentsDetails, 
    getStaffDetails, deleteStudent, updateStudent,
     approveApplicant, rejectApplicant, getLatestStudents, updateStaffDetails,};
