const automationService = require('../services/automationService');
const backupService = require('../services/backupService');
const logger = require('../utils/logger');

const intervalMs = 60 * 1000;

const runTick = async () => {
  try {
    await automationService.runSchedulerTick();
    await backupService.runIfDue();
  } catch (error) {
    logger.error('Scheduler tick failed', error);
  }
};

runTick();
setInterval(runTick, intervalMs);

logger.info('Scheduler started');
