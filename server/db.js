const { Pool } = require('pg');
require('dotenv').config();

let dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: false,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true
};

// Check for VCAP_SERVICES (SAP BTP)
if (process.env.VCAP_SERVICES) {
  try {
    const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
    // Look for a PostgreSQL service (adjust tag/name as needed based on provider)
    // Common tags: 'postgresql', 'postgres', 'rds'
    const postgresService = Object.values(vcapServices)
      .flat()
      .find(service =>
        service.tags.includes('postgresql') ||
        service.tags.includes('postgres') ||
        service.name.includes('postgres')
      );

    if (postgresService && postgresService.credentials) {
      const creds = postgresService.credentials;
      dbConfig = {
        user: creds.username || creds.user,
        host: creds.hostname || creds.host,
        database: creds.dbname || creds.name || creds.database,
        password: creds.password,
        port: creds.port,
        ssl: { rejectUnauthorized: false } // Often required for cloud DBs
      };
      console.log('Using SAP BTP PostgreSQL credentials');
    }
  } catch (err) {
    console.error('Error parsing VCAP_SERVICES:', err);
  }
}

const pool = new Pool(dbConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
