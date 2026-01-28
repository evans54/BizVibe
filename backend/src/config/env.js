const dotenv = require('dotenv');

dotenv.config();

const requireEnv = (key, fallback) => {
  if (process.env[key]) {
    return process.env[key];
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required env var: ${key}`);
};

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  encryptionKey: requireEnv('ENCRYPTION_KEY'),
  serpApiProvider: process.env.SERP_API_PROVIDER || 'serpapi',
  serpApiKey: process.env.SERP_API_KEY,
  brightLocalApiKey: process.env.BRIGHTLOCAL_API_KEY,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioSmsNumber: process.env.TWILIO_SMS_NUMBER,
  twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  googleGbpBaseUrl: process.env.GOOGLE_GBP_BASE_URL || 'https://mybusinessbusinessinformation.googleapis.com/v1',
  googleGbpApiKey: process.env.GOOGLE_GBP_API_KEY,
  sentryDsn: process.env.SENTRY_DSN,
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  backupDirectory: process.env.BACKUP_DIRECTORY || './backups',
  backupCron: process.env.BACKUP_CRON || '0 2 * * *',
  pgDumpPath: process.env.PG_DUMP_PATH || 'pg_dump',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  smtpSecure: process.env.SMTP_SECURE
};
