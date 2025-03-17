const express = require("express");
const { semesterExamination, getSemesterExaminationDetails } = require("../controller/semesterExaminationController");
const { authenticateUser, authorize } = require('../middleware/basicAuth');
const { submitResult } = require('../controller/examResultController');
const { getResults } = require('../controller/examResultController');

const router = express.Router();


// SEMESTER Examination form
router.post("/semesterExamForm", authenticateUser, semesterExamination);

// Get Semester Examination Form
router.post('/getSemesterExamForm/:student_id', authenticateUser, getSemesterExaminationDetails);

// Results
router.post('/api/results', submitResult); // Submit results
router.get('/api/results', getResults); // Fetch results

module.exports = router;