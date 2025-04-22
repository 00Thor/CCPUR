const express = require('express');
const { facultyLogin, forgotFacultyPassword, resetFacultyPassword } = require('../controller/basicFacultyController');



const router = express.Router();


// Faculty Login Route
router.post('/login', facultyLogin);

// Faculty Forgot Password Route
router.post('/forgot-password', forgotFacultyPassword);

// Faculty Reset Password Route
router.post('/faculty-reset-password', resetFacultyPassword);

//UPDATE faculty academic details
//DELETE faculty academic details
//UPDATE faculty committee roles details
//DELETE faculty committee roles details


module.exports = router;