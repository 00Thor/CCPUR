const { getStudents, getStaff, updateStudentById, deletingStudent, getLatestAdmittedStudents} = require('../models/adminModels');
const pool = require('../config/db'); // Import the pool
// Get student details with pagination(Admin & Staff)
async function getStudentsDetails(req, res) {
    try {
        const { page = 1, limit = 25, ...filters } = req.query;
        const offset = (page - 1) * limit;
        const result = await getStudents(filters, limit, offset);
        res.json(result.rows);
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


// Get staff details with pagination
async function getStaffDetails(req, res) {
    try {
        const { page = 1, limit = 5, ...filters } = req.query;
        const offset = (page - 1) * limit;
        const result = await getStaff(filters, limit, offset);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

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
        const { identifier } = req.params; // Identifier could be roll_no or aadhaar_no
        const updatedFields = req.body;

        const updatedStudent = await updateStudentById(identifier, updatedFields);

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
        const result = await getLatestAdmittedStudents();
        const students = result.rows;

        if (students.length === 0) {
            return res.status(404).json({ message: 'No recently admitted students found' });
        }

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching latest admitted students:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports = { getStudentsDetails, getAllStudentsDetails, getStaffDetails, deleteStudent, updateStudent, approveApplicant, rejectApplicant, getLatestStudents};
