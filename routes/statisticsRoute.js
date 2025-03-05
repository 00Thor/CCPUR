const express = require("express");
const router = express.Router();
const { fetchStatistics } = require("../controller/statisticsController");

router.get("/newApplicationStatistics", fetchStatistics);

module.exports = router;
