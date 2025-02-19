const { teachingStaff, nonTeachingStaff, insertAttendance, getStaff, deleteStaffDetails, updateStaffById } = require('../models/facultyInfoModels');
const pool = require('../config/db'); // Ensure pool is imported for database queries

// Fetch Teaching Staff
const getTeachingStaff = async (req, res) => {
    try {
        const staffList = await teachingStaff();
        if (!staffList || staffList.length === 0) {
            return res.status(404).json({ message: "No teaching staff found" });
        }
        return res.status(200).json({ success: true, data: staffList });
    } catch (error) {
        console.error('Error fetching teaching staff:', error.message);
        return res.status(500).json({ success: false, message: 'An error occurred while fetching teaching staff' });
    }
};

// Fetch Non-Teaching Staff
const getNonTeachingStaff = async (req, res) => {
    try {
        const staffList = await nonTeachingStaff();
        if (!staffList || staffList.length === 0) {
            return res.status(404).json({ message: "No non-teaching staff found" });
        }
        return res.status(200).json({ success: true, data: staffList });
    } catch (error) {
        console.error('Error fetching non-teaching staff:', error.message);
        return res.status(500).json({ success: false, message: 'An error occurred while fetching non-teaching staff' });
    }
};

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

// Dynamic Get Staff Details (Admin Only) with Pagination
const getStaffDetails = async (req, res) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        const offset = (page - 1) * limit;
        const result = await getStaff(filters, limit, offset);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// faculty dashboard for faculty to view their profile and more
const facultyDashboard = async (req, res) => {
    try {
        const facultyId = req.faculty.faculty_id;
        const role = req.faculty.role;

        // Fetch faculty details from the database
        const facultyDetails = await getFacultyById(facultyId);

        if (!facultyDetails || facultyDetails.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Faculty profile not found" });
        }

        res.json({
            message: `Welcome Faculty ${facultyId}, role: ${role}`,
            profile: facultyDetails.rows[0],  // Include faculty details
        });

    } catch (error) {
        console.error("Error fetching faculty dashboard:", error.message);
        res.status(500).json({ success: false, message: "An error occurred while fetching faculty dashboard" });
    }
};

// Delete staff 
const deleteStaff = async (req, res) => {
    try {
        const { identifier } = req.params; // Identifier could be roll_no or aadhaar_no

        const deletedstaff = await deleteStaffDetails(identifier);

        if (!deletedstaff) {
            return res.status(404).json({ success: false, message: 'Faculty details not found' });
        }

        res.json({ success: true, message: 'Faculty deleted successfully', deletestaff });
    } catch (error) {
        console.error("Error deleting staff:", error.message);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the staff details' });
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


module.exports = { 
    getTeachingStaff, 
    getNonTeachingStaff, 
    updateAttendance, 
    getStaffDetails,
    facultyDashboard,
    updateStaffDetails,
    deleteStaff,
};
