const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { requireBusinessAccess } = require('../middleware/businessAccess');
const reportService = require('../services/reportService');

const router = express.Router();

router.get('/businesses/:businessId/reports', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const reports = await reportService.listReports(req.business.id);
    return res.json({ reports });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/businesses/:businessId/reports/generate',
  authenticate,
  requireBusinessAccess,
  async (req, res, next) => {
    try {
      const { reportType } = req.body;
      if (!reportType) {
        return res.status(400).json({ message: 'reportType is required' });
      }
      const report = await reportService.generateReport(req.business.id, reportType);
      return res.status(201).json({ report });
    } catch (error) {
      return next(error);
    }
  }
);

router.get('/reports/:reportId', authenticate, async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const isAdmin = req.user.role === 'admin';
    const { rows } = await pool.query(
      `SELECT r.*
       FROM reports r
       JOIN businesses b ON r.business_id = b.id
       WHERE r.id = $1 AND ($2::boolean OR b.user_id = $3)`,
      [reportId, isAdmin, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Report not found' });
    }
    return res.json({ report: rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
