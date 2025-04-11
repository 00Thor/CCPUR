const express = require("express");
const { submitOTP, verifyAadhaarDetails, getAadhaarDetails } = require("../controller/aadhaarDetailsController");
const { authenticateUser } = require("../middleware/basicAuth");
const router = express();

// Store aadhaar details route
router.post("/requestOTP/:user_id", verifyAadhaarDetails);
router.post("/verifyOTP", submitOTP);
router.get("/getAadhaar/:user_id", getAadhaarDetails)


module.exports = router;