const express = require('express');
const {
    getTeachingStaff, 
    getNonTeachingStaff, 
    newFaculty,
    retrieveSpecificFacultyById,
    deleteFaculty,
    updateFacultyPersonalDetails,
    getAllFaculty
} = require('../controller/basicFacultyController');
const { getAllStudentsDetails, getStudentById, deleteStudent, updateStudent, getLatestStudents } = require('../controller/adminController');
const { handleFileErrors, uploadFacultyFilesMiddleware } = require('../middleware/fileUploadMiddleware');
const { insertFacultyAcademicRecords, deleteFacultyAcademicRecords, updateFacultyRecords, readFacultyAcademicRecords } = require('../controller/facultyAcademicRecordsController');
const handleFacultyData = require('../controller/faccultyCRUDController');
const { createCommitteeRoles, retrieveFacultyCommitteeRoles, updateCommitteeRoles, deleteFacultyCommiteeRoles } = require('../controller/committeeRolesController');
const { authenticateUser, authorizeRoles } = require('../middleware/basicAuth');

const router = express.Router();

/* ************************* STUDENT **************************** */

// Route to fetch student details (Admin & Staff)
router.get('/getStudentDetails/:user_id', getStudentById); // Protected Route

// Route to fetch student details (Admin & Staff)
router.get('/getAllStudentDetails', getAllStudentsDetails); // Protected Route

// Route to update student details(Admin Only)
router.put('/updateStudentDetails/:user_id', /*authenticateUser, authorizeRoles('admin'),*/ updateStudent);//Protected route

// Route to delete student details(Admin Only)
router.delete('/deleteStudentDetails/:user_id', /*authenticateUser, authorizeRoles('admin'),*/ deleteStudent); //Protected route

// Route to fetch all/some faculty details (Admin Only)
router.get('/getLatestStudent', getLatestStudents); // Protected Route


/* **************** FACULTY SECTION *************************** */

// Teaching & Non-Teaching Routes
router.get('/teaching-staff',getTeachingStaff);
router.get('/non-teaching-staff',getNonTeachingStaff);


// Protected route: Faculty Dashboard(staff Only)
 router.get('/singleFaculty/:faculty_id',/* authenticateUser, authorizeRoles('staff'),*/ retrieveSpecificFacultyById); //Protected route 


// Entering a new faculty with all Details
router.post('/handleFacultyInsert', uploadFacultyFilesMiddleware,
  handleFileErrors, handleFacultyData);

//GET complete faculty personal details(from all tables)
router.get("/getFacultyDetails", retrieveSpecificFacultyById)


//GET complete faculty personal details(from all tables)
router.get("/getAllFaculty", getAllFaculty)



/*************************************** INDIVIDUALFACULTY DETAILS ACTIONS *********************************** */

//####  PERSONAL
//CREATE NEW Faculty personal 
router.post("/faculty-registration",
  handleFileErrors,
  newFaculty
);

//UPDATE faculty personal details
router.put("/updateFacultyDetails", updateFacultyPersonalDetails)

 //DELETE faculty personal details
 router.delete("/deleteFaculty/:faculty_id", deleteFaculty)


//##### ACADEMIC
//  CREATE faculty academic records
router.post('/facultyRecords', insertFacultyAcademicRecords);

// READ faculty academic records
router.get("/facultyRecords/:faculty_id", readFacultyAcademicRecords);

//UPDATE faculty academic records
router.put("/facultyrecords/:faculty_id", updateFacultyRecords);

// DELETE faculty academic records
router.delete('/facultyRecords/:faculty_id', deleteFacultyAcademicRecords);

//##### COMMITTEE ROLES
// CREATE & assign committee roles
router.post("/committeeRoles", createCommitteeRoles);

// GET / READ committee roles
router.get("/committeeRoles", retrieveFacultyCommitteeRoles);

// UPDATE committee roles
router.put("/committeeRoles", updateCommitteeRoles);

// DELETE committee roles
router.delete("/committeeRoles", deleteFacultyCommiteeRoles);

module.exports = router;