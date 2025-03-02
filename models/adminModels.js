const pool = require("../config/db"); 

async function getStudents(filters, limit, offset) {
    let query = 'SELECT * FROM student_details WHERE 1=1';
    let values = [];
    let paramIndex = 1; // Corrected parameter indexing

    Object.keys(filters).forEach((key) => {
        // Convert text fields to lowercase for case-insensitive filtering
        query += ` AND LOWER(${key}) = LOWER($${paramIndex})`;
        values.push(filters[key]);
        paramIndex++;
    });

    // Corrected LIMIT & OFFSET placeholders
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    return query(query, values);
}
// Get faculty/staff details with optional filters & pagination
async function getStaff(filters, limit, offset) {
    let query = 'SELECT * FROM faculty WHERE 1=1';
    let values = [];
    let count = 1;

    Object.keys(filters).forEach((key) => {
        query += ` AND ${key} = $${count}`;
        values.push(filters[key]);
        count++;
    });

    query += ` LIMIT $${count} OFFSET $${count + 1}`;
    values.push(limit, offset);

    return query(query, values);
}

// Delete a student either by Roll Number or Aadhaar Number
const deletingStudent = async (req, res) => {
    try {
        const { roll_no, aadhaar_no } = req.body;

        if (!roll_no && !aadhaar_no) {
            return res.status(400).json({ success: false, message: "Please provide roll number or Aadhaar number" });
        }

        let query = '';
        let values = [];

        if (roll_no) {
            query = 'DELETE FROM student_details WHERE roll_no = $1 RETURNING *';
            values = [roll_no];
        } else if (aadhaar_no) {
            query = 'DELETE FROM student_details WHERE aadhaar_no = $1 RETURNING *';
            values = [aadhaar_no];
        }

        const result = await query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        res.status(200).json({ success: true, message: "Student deleted successfully", data: result.rows[0] });

    } catch (error) {
        console.error("Error deleting student:", error.message);
        res.status(500).json({ success: false, message: "An error occurred while deleting the student" });
    }
};


// Update student details dynamically
const updateStudentById = async (studentId, updatedFields) => {
    try {
        // Extract keys from updatedFields (ignoring undefined fields)
        const keys = Object.keys(updatedFields).filter(key => updatedFields[key] !== undefined);

        if (keys.length === 0) {
            throw new Error("No fields provided for update");
        }

        // Dynamically build the SET clause (e.g., "name = $1, email = $2")
        const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

        // Values for placeholders
        const values = keys.map(key => updatedFields[key]);
        values.push(studentId); // Add student ID at the end

        // SQL query
        const query = `UPDATE student_details SET ${setClause} WHERE student_id = $${values.length} RETURNING *`;

        // Execute query
        const result = await query(query, values);

        if (result.rows.length === 0) {
            throw new Error("Student not found");
        }

        return result.rows[0]; // Return updated student data
    } catch (error) {
        console.error("Error updating student:", error.message);
        throw new Error(error.message);
    }
};

// Fetch latest admitted students
const getLatestAdmittedStudents = async () => {
    const query = `
        SELECT * FROM student_details
        ORDER BY admission_date DESC
        LIMIT 7;
    `;
    try {
        const result = await pool.query(query); // Use pool.query or client.query
        return result.rows; // Return only the rows
    } catch (error) {
        console.error("Error fetching latest admitted students:", error);
        throw error; // Re-throw the error to handle it in the caller
    }
};

module.exports= { getStudents, getStaff, deletingStudent, updateStudentById, getLatestAdmittedStudents };
