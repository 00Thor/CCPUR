const crypto = require('crypto');

// Generate a secure 32-byte key
const key = crypto.randomBytes(32);
console.log(key.toString('base64'));