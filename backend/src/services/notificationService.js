const twilio = require('twilio');
const env = require('../config/env');
const logger = require('../utils/logger');

const client = env.twilioAccountSid && env.twilioAuthToken
  ? twilio(env.twilioAccountSid, env.twilioAuthToken)
  : null;

const sendSms = async (to, body, businessId) => {
  if (!client || !env.twilioSmsNumber) {
    logger.warn('Twilio SMS not configured', { businessId });
    return { status: 'skipped', channel: 'sms' };
  }

  const message = await client.messages.create({
    from: env.twilioSmsNumber,
    to,
    body
  });

  return { status: 'sent', channel: 'sms', sid: message.sid };
};

const normalizeWhatsapp = (to) => (to.startsWith('whatsapp:') ? to : `whatsapp:${to}`);

const sendWhatsapp = async (to, body, businessId) => {
  if (!client || !env.twilioWhatsappNumber) {
    logger.warn('Twilio WhatsApp not configured', { businessId });
    return { status: 'skipped', channel: 'whatsapp' };
  }

  const message = await client.messages.create({
    from: env.twilioWhatsappNumber,
    to: normalizeWhatsapp(to),
    body
  });

  return { status: 'sent', channel: 'whatsapp', sid: message.sid };
};

module.exports = {
  sendSms,
  sendWhatsapp
};
