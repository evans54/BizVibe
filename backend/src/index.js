const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const server = app.listen(env.port, () => {
  logger.info(`BizVibe API listening on port ${env.port}`);
});

const shutdown = () => {
  logger.info('Shutting down server');
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', error);
  shutdown();
});
