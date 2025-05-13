const pool = require("../config/db"); 

// Query function for fetching a single student
async function getStudentByIdFromDB(user_id) {
    const query = `SELECT * FROM student_details WHERE user_id = $1`;
    const values = [user_id];
    const result = await pool.query(query, values); // Replace `db.query` with your database client
    return result.rows[0];
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
        const query = `UPDATE student_details SET ${setClause} WHERE user_id = $${values.length} RETURNING *`;

        // Execute query using your database client
        const result = await pool.query(query, values);

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

module.exports= { getStudentByIdFromDB, getStaff, updateStudentById, getLatestAdmittedStudents };
