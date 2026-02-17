const app = require('./app');
const connectMongo = require('./db_mongo');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const port = process.env.PORT || 3000;

// Connect to MongoDB
// connectMongo();

app.listen(port, () => {
    console.log(`Server running on port ${port} (HTTP)`);
});
