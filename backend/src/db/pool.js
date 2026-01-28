const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  connectionString: env.databaseUrl
});

pool.on('error', (error) => {
  console.error('Unexpected PG pool error', error);
});

module.exports = pool;
