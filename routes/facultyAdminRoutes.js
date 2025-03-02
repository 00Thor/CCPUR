const express = require('express');
const { newFaculty, facultyLogin, forgotFacultyPassword, resetFacultyPassword} = require('../controller/facultyLoginController');
const { getTeachingStaff, getNonTeachingStaff, updateAttendance,facultyDashboard, updateStaffDetails } = require('../controller/facultyInfoController');
const { getStaffDetails, getAllStudentsDetails, getStudentsDetails, deleteStudent, updateStudent, getLatestStudents } = require('../controller/adminController');
const { deleteStaffDetails } = require('../models/facultyInfoModels');
const { authenticateUser, authorizeRoles } = require('../middleware/basicAuth');
const { studentFileUploadMiddleware } = require('../middleware/fileUploadMiddleware');

const router = express.Router();

/* *************************FACULTY & ADMIN SECTION **************************** */


// Teaching & Non-Teaching Routes
router.get('/teaching-staff', authenticateUser, authorizeRoles('admin', 'staff'), getTeachingStaff); //Protected route
router.get('/non-teaching-staff', authenticateUser, authorizeRoles('admin', 'staff'), getNonTeachingStaff); //Protected route

// Faculty and Admin Protected Routes
router.put('/updateAttendance', authenticateUser, authorizeRoles('staff', 'admin'), updateAttendance); // Protected Route

// Route to fetch student details (Admin & Staff)
router.get('/getStudentDetails', getStudentsDetails); // Protected Route

// Route to fetch student details (Admin & Staff)
router.get('/getAllStudentDetails', getAllStudentsDetails); // Protected Route

// Route to update student details(Admin Only)
router.put('/updateStudentDetails', authenticateUser, authorizeRoles('admin'), updateStudent);//Protected route

// Route to delete student details(Admin Only)
router.delete('/deleteStudentDetails', authenticateUser, authorizeRoles('admin'), deleteStudent); //Protected route

// Route to fetch all/some faculty details (Admin Only)
router.get('/getStaffDetails', getStaffDetails); // Protected Route

// Protected route: Faculty Dashboard(staff Only)
router.get('/faculty-Dashboard', authenticateUser, authorizeRoles('staff'), facultyDashboard); //Protected route

//Route to update Staff Details
router.put('/updateStaffDetails', authenticateUser, authorizeRoles('admin'), updateStaffDetails); //Protected route

//Route to delete Staff Details
router.delete('/deleteStaffDetails',authenticateUser, authorizeRoles('admin'), deleteStaffDetails);//ptotected route

// Route to fetch all/some faculty details (Admin Only)
router.get('/getLatestStudent', getLatestStudents); // Protected Route

// Faculty Registration Route
router.post('/faculty-registration', studentFileUploadMiddleware, newFaculty);

// Faculty Login Route
router.post('/faculty-login', facultyLogin);

// Faculty Forgot Password Route
router.post('/faculty-forgot-password', forgotFacultyPassword);

// Faculty Reset Password Route
router.post('/faculty-reset-password', resetFacultyPassword);



module.exports = router;