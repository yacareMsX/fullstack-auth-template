const path = require('path');
const fs = require('fs');
console.log('__dirname:', __dirname);
console.log('Uploads Path:', path.join(__dirname, 'uploads'));
const filePath = path.join(__dirname, 'uploads', 'sap_INV-SAP-00000000003_1769370965917.xml');
console.log('Target File:', filePath);
console.log('File Exists:', fs.existsSync(filePath));
