const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { hashToken } = require('../utils/crypto');
const userService = require('./userService');

const issueTokens = async (user) => {
  const tokenId = uuidv4();
  const refreshToken = signRefreshToken(user, tokenId);
  const accessToken = signAccessToken(user);
  const decodedRefresh = verifyRefreshToken(refreshToken);
  const expiresAt = new Date(decodedRefresh.exp * 1000);

  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [tokenId, user.id, hashToken(refreshToken), expiresAt]
  );

  return { accessToken, refreshToken, expiresAt };
};

const authenticateUser = async ({ email, password, mfaCode }) => {
  const user = await userService.findUserByEmail(email);
  if (!user) {
    return { error: 'Invalid credentials' };
  }

  const passwordMatch = await comparePassword(password, user.password_hash);
  if (!passwordMatch) {
    return { error: 'Invalid credentials' };
  }

  if (user.mfa_enabled) {
    const verified = require('speakeasy').totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: mfaCode || ''
    });
    if (!verified) {
      return { error: 'MFA required', mfaRequired: true };
    }
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    return { error: 'Refresh token required' };
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    return { error: 'Invalid refresh token' };
  }

  const { rows } = await pool.query(
    'SELECT * FROM refresh_tokens WHERE id = $1 AND user_id = $2',
    [payload.jti, payload.sub]
  );

  const tokenRecord = rows[0];
  if (!tokenRecord || tokenRecord.revoked_at) {
    return { error: 'Refresh token revoked' };
  }

  if (hashToken(refreshToken) !== tokenRecord.token_hash) {
    return { error: 'Refresh token mismatch' };
  }

  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [tokenRecord.id]);

  const user = await userService.getUserById(payload.sub);
  if (!user) {
    return { error: 'User not found' };
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    return;
  }

  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
    [payload.jti]
  );
};

module.exports = {
  issueTokens,
  authenticateUser,
  refreshSession,
  revokeRefreshToken
};
