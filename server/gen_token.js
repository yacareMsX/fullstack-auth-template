require('dotenv').config();
const { generateToken } = require('./utils/jwt');
const token = generateToken(1, 'iprieto@example.com', 'admin');
console.log(token);
