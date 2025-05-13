const express = require("express");
const router = express.Router();
const { fetchApplicationStatistics, adminDashboardStats } = require("../controller/statisticsController");
const { authenticateUser, authorizeRoles } = require("../middleware/basicAuth");


router.get("/newApplicationStatistics",
    //authenticateUser,
    //authorizeRoles('admin'), 
    fetchApplicationStatistics);
router.get("/adminDashboard",
    //authenticateUser,
   // authorizeRoles('admin'), 
    adminDashboardStats)

module.exports = router;
