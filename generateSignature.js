const crypto = require("crypto");

// Replace these values with your test data
const secret = "SfMyOkBO1lMlEox7rbQ2D1tq";
const razorpay_order_id = "order_HJIKWRTvG15hAq";
const razorpay_payment_id = "pay_HJIKWRTvG15hAq";

// Concatenate order_id and payment_id
const data = `${razorpay_order_id}|${razorpay_payment_id}`;

// Generate HMAC SHA256 signature
const signature = crypto.createHmac("sha256", secret).update(data).digest("hex");

console.log("Generated Signature:", signature);
