const express = require("express");
const router = express.Router();
const { fetchApplicationStatistics, adminDashboardStats } = require("../controller/statisticsController");


router.get("/newApplicationStatistics", fetchApplicationStatistics);
router.get("/adminDashboard", adminDashboardStats)

module.exports = router;
