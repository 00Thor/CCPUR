const express = require("express");
const { semesterExamination } = require("../controller/semesterExaminationController");
const { getAllRecords,getRecordsByStudent,addRecord,updateRecord,deleteRecord, } = require('../controller/academicRecordsController');
const { authenticateUser, authorize } = require('../middleware/basicAuth');
const { submitResult } = require('../controller/examResultController');
const { getResults } = require('../controller/examResultController');

const router = express.Router();


// SEMESTER Examination form
router.post("/semesterExamForm", authenticateUser, semesterExamination);

// Academic records(sem results)
router.get("/getallAcademicRecords", getAllRecords);
router.get("/getstudentAcademicRecord", getRecordsByStudent);
router.post("/addRecord", addRecord);
router.put("/updateAcademicRecords", updateRecord);
router.delete("/deleteAcademicRecords", deleteRecord);


// Results
router.post('/api/results', submitResult); // Submit results
router.get('/api/results', getResults); // Fetch results

module.exports = router;