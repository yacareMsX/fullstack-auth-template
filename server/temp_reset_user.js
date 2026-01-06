const db = require('./db');
const bcrypt = require('bcrypt');

const run = async () => {
    try {
        const hashedPassword = await bcrypt.hash('password', 10);
        await db.query(`
            UPDATE users 
            SET is_active = true, 
                password_hash = $1 
            WHERE email = 'usuario1@t4s.com'
        `, [hashedPassword]);
        console.log('User usuario1@t4s.com activated and password reset to "password"');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

run();
