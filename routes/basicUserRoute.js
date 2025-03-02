const express = require("express");
const { authenticateUser, authorizeRoles } = require('../middleware/basicAuth');
const { newUser, login, resetpassword, forgotpassword, getUser } = require("../controller/basicUserController");

const router = express.Router();


/* *************************** SIMPLE OPREATIONS SECTION ************************** */

router.post("/register", newUser);
router.post("/login", login);
router.post("/resetpassword", resetpassword);
router.post("/forgotpassword", forgotpassword);
router.get("/getusers", authenticateUser, getUser);



module.exports = router;

