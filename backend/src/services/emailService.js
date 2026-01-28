const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter;

const createTransporter = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: Number(env.smtpPort || 587),
    secure: env.smtpSecure === 'true',
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
};

transporter = createTransporter();

const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter || !env.smtpFrom) {
    logger.warn('SMTP not configured, skipping email');
    return { status: 'skipped' };
  }

  const info = await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
    html
  });

  return { status: 'sent', messageId: info.messageId };
};

module.exports = {
  sendEmail
};
