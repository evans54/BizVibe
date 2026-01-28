const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const userService = require('./userService');

const initiateMfaSetup = async (user) => {
  const secret = speakeasy.generateSecret({
    name: `BizVibe (${user.email})`
  });

  await userService.setMfaPendingSecret(user.id, secret.base32);
  const qrCode = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCode
  };
};

const verifyMfaSetup = async (user, token) => {
  if (!user.mfa_pending_secret) {
    return { error: 'No MFA setup in progress' };
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfa_pending_secret,
    encoding: 'base32',
    token
  });

  if (!verified) {
    return { error: 'Invalid MFA token' };
  }

  await userService.enableMfa(user.id, user.mfa_pending_secret);
  return { success: true };
};

module.exports = {
  initiateMfaSetup,
  verifyMfaSetup
};
