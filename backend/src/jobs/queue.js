const { Queue } = require('bullmq');
const redis = require('../utils/redis');

const connection = redis ? redis.options : undefined;

const automationQueue = new Queue('automation', {
  connection
});

const addAutomationJob = (name, data) =>
  automationQueue.add(name, data, {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000
    }
  });

module.exports = {
  automationQueue,
  addAutomationJob
};
