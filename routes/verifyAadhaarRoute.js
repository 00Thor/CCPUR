const express = require("express");
const { submitOTP, verifyAadhaarDetails, getAadhaarDetails } = require("../controller/aadhaarDetailsController");
const { authenticateUser } = require("../middleware/basicAuth");
const router = express();

// const crypto = require("crypto"); // For hashing
// require("dotenv").config();
// const db = require("../config/db");
// const { Console } = require("console");
// const secretKey = process.env.ENCRYPTION_KEY;
// // Temporary store for mapping `ref_id` -> { user_id, aadhaar_number }
// const aadhaarVerificationStore = {};

// // Hash Aadhaar number using SHA-256
// const hashAadhaar = (aadhaar_number) => {
//     return crypto.createHash("sha256").update(aadhaar_number).digest("hex");
// };

// // Mask Aadhaar Number (Show only last 4 digits)
// const maskAadhaar = (aadhaar_number) => {
//     const aadhaarStr = String(aadhaar_number); // Convert to string
//     return `XXXX-XXXX-${aadhaarStr.slice(-4)}`;
// };

// // Encrypt data using PostgreSQL's pgcrypto extension
// const encryptData = (data) => {
//     return `pgp_sym_encrypt('${data}', '${secretKey}')`;
// };


// Store aadhaar details route
router.post("/requestOTP/:user_id", verifyAadhaarDetails);
router.post("/verifyOTP", submitOTP);
router.get("/getAadhaar/:user_id", getAadhaarDetails)
/*
// Store Aadhaar details securely
router.post("/asdf", async (req, res) => {
    try {
        const { data } = req.body; // Extract data from request
        const user_id = req.body.user_id;  // Ensure user_id is passed
        const aadhaar_number = req.body.aadhaar_number; // Ensure aadhaar_number is passed

        if (!data || !user_id || !aadhaar_number) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        console.log(data, user_id, aadhaar_number);
        const {  
            status, 
            message,
            care_of,
            address,
            dob,
            email,
            gender, 
            name,
            split_address = {} 
        } = data;

        const { 
            country, dist, house, landmark, pincode, 
            po, state, street, subdist, vtc, locality 
        } = split_address;

        // Secure Aadhaar details
        const aadhaar_masked = maskAadhaar(aadhaar_number);
        const aadhaar_hash = hashAadhaar(aadhaar_number);

        const query = `
            INSERT INTO aadhaar_verification (
                aadhaar_masked, aadhaar_hash, status, message, care_of, address, dob, email, 
                gender, name, country, dist, house, landmark, pincode, po, 
                state, street, subdist, vtc, locality, user_id
            ) 
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15, $16, 
                $17, $18, $19, $20, $21, $22
            )
        `;

        const values = [
            aadhaar_masked, aadhaar_hash, status, message, 
            encryptData(care_of), encryptData(address), encryptData(dob), encryptData(email),
            gender, encryptData(name), country, encryptData(dist), encryptData(house), encryptData(landmark), 
            pincode, encryptData(po), state, encryptData(street), encryptData(subdist), 
            encryptData(vtc), encryptData(locality), user_id
        ];

        await db.query(query, values);
        console.log("Aadhaar details stored securely.");

        res.status(200).json({ success: true, message: "Aadhaar details stored successfully" });
    } catch (error) {
        console.error("Database Error:", error.message);
        res.status(500).json({ error: "Database Error: " + error.message });
    }
});

*/

module.exports = router;