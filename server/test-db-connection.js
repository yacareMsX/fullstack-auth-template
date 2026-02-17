require('dotenv').config();
const db = require('./db');

(async () => {
    try {
        console.log("Testing DB connection...");
        const res = await db.query('SELECT NOW()');
        console.log('DB Connection successful:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('DB Connection Failed:', err);
        process.exit(1);
    }
})();
