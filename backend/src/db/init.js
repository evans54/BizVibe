const fs = require('fs');
const path = require('path');
const pool = require('./pool');
const logger = require('../utils/logger');

const schemaPath = path.join(__dirname, 'schema.sql');

const init = async () => {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    logger.info('Database schema initialized');
  } catch (error) {
    logger.error('Failed to init database', error);
    throw error;
  } finally {
    await pool.end();
  }
};

init().catch((error) => {
  logger.error('Failed to init database', error);
  process.exit(1);
});
