const db = require('./db');

const run = async () => {
    try {
        const res = await db.query('SELECT * FROM users LIMIT 1');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        // We can't easily close the pool from here as it's not exported closed, but process.exit works
        process.exit();
    }
};

run();
