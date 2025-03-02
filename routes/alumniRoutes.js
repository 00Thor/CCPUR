const express = require("express");
const { graduateStudent, restoreStudent } = require("../controller/graduationController");
const { authenticateUser, authorizeRoles } = require('../middleware/basicAuth');
const router = express.Router();

//Route to move student from 6th sem to Graduated
router.post("/archiveStudent", graduateStudent);

//Route to undo mistakenly moved student from 6th sem to Graduated 
router.post("/archiveStudent", restoreStudent);

module.exports = router;