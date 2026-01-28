const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const exportService = require('../services/exportService');

const router = express.Router();

router.get('/reports/:reportId/export', authenticate, async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const format = (req.query.format || 'pdf').toLowerCase();
    const isAdmin = req.user.role === 'admin';
    const { rows } = await pool.query(
      `SELECT r.*
       FROM reports r
       JOIN businesses b ON r.business_id = b.id
       WHERE r.id = $1 AND ($2::boolean OR b.user_id = $3)`,
      [reportId, isAdmin, req.user.id]
    );
    const report = rows[0];
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (format === 'csv') {
      const csv = exportService.generateCsv(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${reportId}.csv`);
      return res.send(csv);
    }

    const buffer = await exportService.generatePdfBuffer(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${reportId}.pdf`);
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
