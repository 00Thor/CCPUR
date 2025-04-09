const axios = require("axios");
const crypto = require("crypto"); // For hashing
require("dotenv").config();
const db = require("../config/db");
const secretKey = process.env.ENCRYPTION_KEY;
// Temporary store for mapping `ref_id` -> { user_id, aadhaar_number }
const aadhaarVerificationStore = {};

// Hash Aadhaar number using SHA-256
const hashAadhaar = (aadhaar_number) => {
    return crypto.createHash("sha256").update(aadhaar_number).digest("hex");
};

// Mask Aadhaar Number (Show only last 4 digits)
const maskAadhaar = (aadhaar_number) => {
    return `XXXX-XXXX-${aadhaar_number.slice(-4)}`;
};

// Encrypt data using PostgreSQL's pgcrypto extension
const encryptData = (data) => {
    return `pgp_sym_encrypt('${data}', '${secretKey}')`;
};

// Send OTP
const verifyAadhaarDetails = async (req, res) => {
    const { user_id } = req.params;
    const { aadhaar_number } = req.body;

    if (!user_id) {
        return res.status(400).json({ success: false, message: "No user ID provided" });
    }
    if (!aadhaar_number) {
        return res.status(400).json({ success: false, message: "No Aadhaar number provided" });
    }

    try {
        const response = await axios.post(
            "https://api.cashfree.com/verification/offline-aadhaar/otp",
            { aadhaar_number },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": process.env.CASHFREE_CLIENT_ID,
                    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
                },
            }
        );

        const { ref_id } = response.data;

        // Store ref_id mapping in memory
        aadhaarVerificationStore[ref_id] = { user_id, aadhaar_number };

        return res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error Sending OTP:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "An error occurred during Aadhaar OTP request.",
            error: error.response?.data || error.message,
        });
    }
};

// Submit OTP
const submitOTP = async (req, res) => {
    const { ref_id, otp } = req.body;

    if (!ref_id || !otp) {
        return res.status(400).json({ success: false, message: "Missing ref_id or OTP" });
    }

    // Retrieve user_id and aadhaar_number using ref_id
    const verificationData = aadhaarVerificationStore[ref_id];
    if (!verificationData) {
        return res.status(400).json({ success: false, message: "Invalid or expired ref_id" });
    }

    const { user_id, aadhaar_number } = verificationData;

    try {
        const response = await axios.post(
            "https://api.cashfree.com/verification/offline-aadhaar/verify",
            { otp, ref_id },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": process.env.CASHFREE_CLIENT_ID,
                    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
                },
            }
        );

        if (response.data.status === "VALID") {
            await storeAadhaarDetails(response.data, user_id, aadhaar_number);
            return res.json({ success: true, data: response.data });
        } else {
            return res.status(400).json({ success: false, message: "Aadhaar verification failed", data: response.data });
        }
    } catch (error) {
        console.error("Error Verifying OTP:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "An error occurred during Aadhaar OTP verification.",
            error: error.response?.data || error.message,
        });
    } finally {
        // Clean up after verification
        delete aadhaarVerificationStore[ref_id];
    }
};

// Store Aadhaar details securely
const storeAadhaarDetails = async (aadhaarData, user_id, aadhaar_number) => {
    try {
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
        } = aadhaarData;

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
                $1, $2, $3, $4, ${encryptData(care_of)}, ${encryptData(address)}, ${encryptData(dob)}, ${encryptData(email)},
                $5, ${encryptData(name)}, $6, ${encryptData(dist)}, ${encryptData(house)}, ${encryptData(landmark)}, $7, ${encryptData(po)}, 
                $8, ${encryptData(street)}, ${encryptData(subdist)}, ${encryptData(vtc)}, ${encryptData(locality)}, $9
            )
        `;

        const values = [
            aadhaar_masked, aadhaar_hash, status, message, gender, country, pincode, state, user_id
        ];

        await db.query(query, values);
        console.log("Aadhaar details stored securely.");
    } catch (error) {
        console.error("Database Error:", error.message);
    }
};

// get and decrypt aadhaar
const getAadhaarDetails = async (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
        return res.status(400).json({ success: false, message: "No user ID provided" });
    }

    try {
        const query = `
            SELECT
                aadhaar_masked,
                status,
                message,
                PGP_SYM_DECRYPT(care_of::bytea, $1)::TEXT AS care_of,
                PGP_SYM_DECRYPT(address::bytea, $1)::TEXT AS address,
                PGP_SYM_DECRYPT(dob::bytea, $1)::TEXT AS dob,
                PGP_SYM_DECRYPT(email::bytea, $1)::TEXT AS email,
                gender,
                PGP_SYM_DECRYPT(name::bytea, $1)::TEXT AS name,
                country,
                PGP_SYM_DECRYPT(dist::bytea, $1)::TEXT AS dist,
                PGP_SYM_DECRYPT(house::bytea, $1)::TEXT AS house,
                PGP_SYM_DECRYPT(landmark::bytea, $1)::TEXT AS landmark,
                pincode,
                PGP_SYM_DECRYPT(po::bytea, $1)::TEXT AS po,
                state,
                PGP_SYM_DECRYPT(street::bytea, $1)::TEXT AS street,
                PGP_SYM_DECRYPT(subdist::bytea, $1)::TEXT AS subdist,
                PGP_SYM_DECRYPT(vtc::bytea, $1)::TEXT AS vtc,
                PGP_SYM_DECRYPT(locality::bytea, $1)::TEXT AS locality
            FROM aadhaar_verification
            WHERE user_id = $2
            LIMIT 1
        `;

        const values = [secretKey, user_id];

        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "No Aadhaar details found for this user." });
        }

        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error retrieving Aadhaar details:", error.message);
        return res.status(500).json({ success: false, message: "Error retrieving Aadhaar details." });
    }
};


module.exports = { verifyAadhaarDetails, submitOTP, getAadhaarDetails };
