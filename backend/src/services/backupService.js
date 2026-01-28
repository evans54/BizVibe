const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');
const cronParser = require('cron-parser');

const stateFile = path.join(env.backupDirectory, 'backup-state.json');
const backupCron = env.backupCron || '0 2 * * *';

const ensureDir = () => {
  if (!fs.existsSync(env.backupDirectory)) {
    fs.mkdirSync(env.backupDirectory, { recursive: true });
  }
};

const readState = () => {
  if (!fs.existsSync(stateFile)) {
    return { lastRun: null, nextRun: null };
  }
  return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
};

const writeState = (state) => {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
};

const computeNextRun = (fromDate) => {
  const interval = cronParser.parseExpression(backupCron, {
    currentDate: fromDate || new Date()
  });
  return interval.next().toDate();
};

const encryptFile = (filePath) => {
  const key = Buffer.from(env.encryptionKey, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = fs.readFileSync(filePath);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  const output = Buffer.concat([iv, tag, encrypted]);
  const outputPath = `${filePath}.enc`;
  fs.writeFileSync(outputPath, output);
  fs.unlinkSync(filePath);
  return outputPath;
};

const runBackup = () =>
  new Promise((resolve, reject) => {
    ensureDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(env.backupDirectory, `bizvibe-${timestamp}.sql`);
    const pgDumpPath = env.pgDumpPath || 'pg_dump';

    execFile(pgDumpPath, [env.databaseUrl, '--file', outputPath], (error) => {
      if (error) {
        logger.error('pg_dump failed', error);
        reject(error);
        return;
      }
      const encryptedPath = encryptFile(outputPath);
      logger.info('Backup created', { encryptedPath });
      resolve(encryptedPath);
    });
  });

const runIfDue = async () => {
  ensureDir();
  const state = readState();
  const nextRun = state.nextRun ? new Date(state.nextRun) : computeNextRun();
  if (new Date() < nextRun) {
    return { status: 'scheduled', nextRun };
  }

  await runBackup();
  const newState = {
    lastRun: new Date().toISOString(),
    nextRun: computeNextRun(new Date()).toISOString()
  };
  writeState(newState);
  return { status: 'completed', nextRun: newState.nextRun };
};

module.exports = {
  runIfDue
};
