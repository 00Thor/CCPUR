const  pool  = require('../config/db');

const submitResult = async (req, res) => {
    try {
        const { name, program, semester, status } = req.body;

        if (!name || !program || !semester || !status) {
            return res.status(400).json({ error: "All fields are required." });
        }

        await pool.query(
            `INSERT INTO exam_results (name, program, semester, status)
             VALUES ($1, $2, $3, $4)`,
            [name, program, semester, status]
        );

        res.status(201).json({ message: "Result submitted successfully!" });
    } catch (error) {
        console.error("Error submitting result:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
};

const getResults = async (req, res) => {
    try {
        const results = await pool.query(
            `SELECT name, program, semester, status FROM exam_results ORDER BY semester`
        );

        res.status(200).json(results.rows);
    } catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
};
module.exports =  {submitResult, getResults};
