const pool = require('../config/db');

const graduateStudent = async (req, res) => {
    const { student_id } = req.params;
    const graduatedBy = req.user.id; // Admin/Staff performing action(Track whois graduating the student)

    try {
        const updateResult = await pool.query(
            "UPDATE student_details SET status = 'graduated', updated_by = $1 WHERE student_id = $2 RETURNING *",
            [graduatedBy, student_id]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: "Student not found or already graduated." });
        }

        res.status(200).json({ message: "Student graduated successfully and moved to alumni." });
    } catch (error) {
        console.error("Error graduating student:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const restoreStudent = async (req, res) => {
    const { student_id } = req.params;
    const restoredBy = req.user.id; // Admin/Staff restoring student

    try {
        const updateResult = await pool.query(
            "UPDATE graduation_logs SET status = 'restored', restored_by = $1, restored_at = NOW() WHERE student_id = $2 RETURNING *",
            [restoredBy, student_id]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: "Student not found in alumni records." });
        }

        res.status(200).json({ message: "Student restored successfully." });
    } catch (error) {
        console.error("Error restoring student:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
module.exports = { graduateStudent, restoreStudent };

