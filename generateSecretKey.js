const crypto = require('crypto');

// Tạo một secretKey ngẫu nhiên dài 32 ký tự
const secretKey = crypto.randomBytes(32).toString('hex');

console.log(secretKey);
