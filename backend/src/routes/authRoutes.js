const express = require('express');
const speakeasy = require('speakeasy');
const authService = require('../services/authService');
const userService = require('../services/userService');
const mfaService = require('../services/mfaService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await userService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await userService.createUser({ name, email, password, role: 'business_user' });
    const tokens = await authService.issueTokens(user);
    return res.status(201).json({ user, ...tokens });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, mfaCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await authService.authenticateUser({ email, password, mfaCode });
    if (result.error) {
      const status = result.mfaRequired ? 401 : 401;
      return res.status(status).json({ message: result.error, mfaRequired: result.mfaRequired || false });
    }

    const { user, accessToken, refreshToken, expiresAt } = result;
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfa_enabled
      },
      accessToken,
      refreshToken,
      expiresAt
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshSession(refreshToken);
    if (result.error) {
      return res.status(401).json({ message: result.error });
    }

    const { user, accessToken, refreshToken: newRefresh, expiresAt } = result;
    return res.json({
      user,
      accessToken,
      refreshToken: newRefresh,
      expiresAt
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.revokeRefreshToken(refreshToken);
    return res.json({ status: 'revoked' });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/mfa/setup', authenticate, async (req, res, next) => {
  try {
    const user = await userService.getUserWithSecrets(req.user.id);
    const setup = await mfaService.initiateMfaSetup(user);
    return res.json(setup);
  } catch (error) {
    return next(error);
  }
});

router.post('/mfa/verify', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    const user = await userService.getUserWithSecrets(req.user.id);
    const result = await mfaService.verifyMfaSetup(user, token);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }
    return res.json({ status: 'enabled' });
  } catch (error) {
    return next(error);
  }
});

router.post('/mfa/disable', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await userService.getUserWithSecrets(req.user.id);
    if (!user.mfa_enabled) {
      return res.status(400).json({ message: 'MFA is not enabled' });
    }
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: token || ''
    });
    if (!verified) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }
    await userService.disableMfa(user.id);
    return res.json({ status: 'disabled' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
