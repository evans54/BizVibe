const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireBusinessAccess } = require('../middleware/businessAccess');
const dashboardService = require('../services/dashboardService');

const router = express.Router();

router.get('/businesses/:businessId/dashboard', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getDashboard(req.business.id);
    return res.json(dashboard);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
