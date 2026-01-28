const env = require('../config/env');
const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  logger.error('API error', error);
  res.status(status).json({
    message: error.message || 'Internal server error',
    details: env.nodeEnv === 'development' ? error.stack : undefined
  });
};

module.exports = errorHandler;
