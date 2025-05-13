const {insertAttendance } = require("../models/basicFacultyModel");

// Update Attendance
const updateAttendance = async (req, res) => {
    try {
        const { name, roll_no, date, status } = req.body;

        // Validate input fields
        if (!name || !roll_no || !date || !status) {
            return res.status(400).json({ success: false, message: "Please provide all fields." });
        }

        // Call the model function to insert attendance
        const attendanceRecord = await insertAttendance({ name, roll_no, date, status });

        return res.status(201).json({ success: true, data: attendanceRecord });
    } catch (error) {
        console.error('Error updating attendance:', error.message);
        return res.status(500).json({ success: false, message: 'An error occurred while updating attendance' });
    }
};

module.exports = { 
    updateAttendance, 
};