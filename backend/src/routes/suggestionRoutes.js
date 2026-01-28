const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireBusinessAccess } = require('../middleware/businessAccess');
const suggestionService = require('../services/suggestionService');

const router = express.Router();

router.get('/businesses/:businessId/suggestions', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const suggestions = await suggestionService.generateSuggestions(req.business.id);
    return res.json({ suggestions });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
