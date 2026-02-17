try {
    require('dotenv').config();
    console.log("Attempting to require server/routes/face/index.js...");
    const faceRoutes = require('./server/routes/face');
    console.log("Successfully required face routes");
} catch (error) {
    console.error("Error requiring face routes:", error);
    console.error(error.stack);
    process.exit(1);
}
