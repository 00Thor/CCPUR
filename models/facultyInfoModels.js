const pool = require('../config/db');

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

// Get all faculty/staff with optional filters and pagination
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

    return pool.query(query, values);
}

// Delete staff (Admin only)
const deleteStaffDetails = async (req, res) => {
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
        // Extract keys from updatedFields (ignoring undefined fields)
        const keys = Object.keys(updatedFields).filter(key => updatedFields[key] !== undefined);

        if (keys.length === 0) {
            throw new Error("No fields provided for update");
        }

        // Dynamically build the SET clause (e.g., "name = $1, email = $2")
        const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

        // Values for placeholders
        const values = keys.map(key => updatedFields[key]);
        values.push(staffId); // Add staff ID at the end

        // SQL query
        const query = `UPDATE faculty SET ${setClause} WHERE faculty_id = $${values.length} RETURNING *`;

        // Execute query
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error("Faculty not found");
        }

        return result.rows[0]; // Return updated staff data
    } catch (error) {
        console.error("Error updating staff details:", error.message);
        throw new Error(error.message);
    }
};

module.exports = {
    teachingStaff,
    nonTeachingStaff,
    insertAttendance,
    getStaff,
    deleteStaffDetails,
    updateStaffById,
};