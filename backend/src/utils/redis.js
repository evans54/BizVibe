const Redis = require('ioredis');
const env = require('../config/env');

const redis = env.redisUrl ? new Redis(env.redisUrl) : null;

if (redis) {
  redis.on('error', (error) => {
    console.error('Redis error', error);
  });
}

module.exports = redis;
