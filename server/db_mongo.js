const mongoose = require('mongoose');

const connectMongo = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('MONGODB_URI not defined in .env. Skipping MongoDB connection.');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // We don't exit process here to allow the app to run with just Postgres if Mongo fails (optional)
    }
};

module.exports = connectMongo;
