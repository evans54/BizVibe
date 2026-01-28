const crypto = require('crypto');
const env = require('../config/env');

const algorithm = 'aes-256-gcm';
const key = Buffer.from(env.encryptionKey, 'hex');

if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be a 32-byte hex string');
}

const encrypt = (value) => {
  if (!value) {
    return null;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag().toString('base64');
  return `${iv.toString('base64')}.${tag}.${encrypted}`;
};

const decrypt = (value) => {
  if (!value) {
    return null;
  }
  const [ivText, tagText, encrypted] = value.split('.');
  const iv = Buffer.from(ivText, 'base64');
  const tag = Buffer.from(tagText, 'base64');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  encrypt,
  decrypt,
  hashToken
};
