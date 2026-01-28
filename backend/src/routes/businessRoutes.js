const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireBusinessAccess } = require('../middleware/businessAccess');
const businessService = require('../services/businessService');
const gbpService = require('../services/gbpService');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const businesses = await businessService.listBusinessesForUser(req.user);
    return res.json({ businesses });
  } catch (error) {
    return next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, category, address, phone, website } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Business name is required' });
    }
    const business = await businessService.createBusiness(req.user.id, {
      name,
      category,
      address,
      phone,
      website
    });
    return res.status(201).json({ business });
  } catch (error) {
    return next(error);
  }
});

router.get('/:businessId', authenticate, requireBusinessAccess, async (req, res) => {
  res.json({ business: req.business });
});

router.patch('/:businessId', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const { name, category, address, phone, website } = req.body;
    const payload = {
      name: name || req.business.name,
      category: category || req.business.category,
      address: address || req.business.address,
      phone: phone || req.business.phone,
      website: website || req.business.website
    };
    const business = await businessService.updateBusiness(req.business.id, payload);
    return res.json({ business });
  } catch (error) {
    return next(error);
  }
});

router.post('/:businessId/link-gbp', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const { googleProfileId, accessToken, refreshToken } = req.body;
    if (!googleProfileId) {
      return res.status(400).json({ message: 'googleProfileId is required' });
    }
    const business = await businessService.linkGoogleProfile(req.business.id, {
      googleProfileId,
      accessToken,
      refreshToken
    });
    return res.json({ business });
  } catch (error) {
    return next(error);
  }
});

router.post('/:businessId/gbp-sync', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const tokens = await businessService.getGoogleTokens(req.business.id);
    if (!tokens?.accessToken) {
      return res.status(400).json({ message: 'Google access token not configured' });
    }
    if (!req.business.googleProfileId) {
      return res.status(400).json({ message: 'Google profile is not linked' });
    }
    const profile = await gbpService.fetchBusinessProfile(req.business.googleProfileId, tokens.accessToken);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    const updated = await businessService.updateBusiness(req.business.id, {
      name: profile.name || req.business.name,
      category: profile.category || req.business.category,
      address: profile.address || req.business.address,
      phone: profile.phone || req.business.phone,
      website: profile.website || req.business.website
    });
    return res.json({ business: updated });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:businessId/gbp-update', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const tokens = await businessService.getGoogleTokens(req.business.id);
    if (!tokens?.accessToken) {
      return res.status(400).json({ message: 'Google access token not configured' });
    }
    if (!req.business.googleProfileId) {
      return res.status(400).json({ message: 'Google profile is not linked' });
    }
    const updates = req.body;
    const updatedProfile = await gbpService.updateBusinessProfile(
      req.business.googleProfileId,
      tokens.accessToken,
      updates
    );

    const updated = await businessService.updateBusiness(req.business.id, {
      name: updatedProfile?.name || req.business.name,
      category: updatedProfile?.category || req.business.category,
      address: updatedProfile?.address || req.business.address,
      phone: updatedProfile?.phone || req.business.phone,
      website: updatedProfile?.website || req.business.website
    });
    return res.json({ business: updated, gbpProfile: updatedProfile });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
