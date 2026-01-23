const app = require('./app');
require('dotenv').config();

const fs = require('fs');
const https = require('https');
const path = require('path');

const port = process.env.PORT || 3000;

const options = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

https.createServer(options, app).listen(port, () => {
    console.log(`Server running on port ${port} (HTTPS)`);
});
