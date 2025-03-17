const express = require("express");
const { getRecordsByStudent,addAcademicRecord,updateAcademicRecord,deleteAcademicRecord, } = require('../controller/academicRecordsController');
const { authenticateUser, authorize } = require('../middleware/basicAuth');


const router = express.Router();

// Academic records(sem results)
router.get("/getstudentAcademicRecord", getRecordsByStudent);
router.post("/addRecord", addAcademicRecord);
router.put("/updateAcademicRecords", updateAcademicRecord);
router.delete("/deleteAcademicRecords", deleteAcademicRecord);

module.exports = router;