const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { requireBusinessAccess } = require('../middleware/businessAccess');
const keywordService = require('../services/keywordService');

const router = express.Router();

router.post('/businesses/:businessId/keywords', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ message: 'Keyword is required' });
    }
    const result = await keywordService.addKeyword(req.business.id, keyword);
    return res.status(201).json({ keyword: result });
  } catch (error) {
    return next(error);
  }
});

router.get('/businesses/:businessId/keywords', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const keywords = await keywordService.listKeywords(req.business.id);
    return res.json({ keywords });
  } catch (error) {
    return next(error);
  }
});

router.get('/keywords/:keywordId/rankings', authenticate, async (req, res, next) => {
  try {
    const { keywordId } = req.params;
    const limit = Number(req.query.limit || 30);
    const isAdmin = req.user.role === 'admin';
    const { rows } = await pool.query(
      `SELECT kr.rank, kr.checked_at
       FROM keyword_rankings kr
       JOIN keywords k ON kr.keyword_id = k.id
       JOIN businesses b ON k.business_id = b.id
       WHERE kr.keyword_id = $1
         AND ($2::boolean OR b.user_id = $3)
       ORDER BY kr.checked_at DESC
       LIMIT $4`,
      [keywordId, isAdmin, req.user.id, limit]
    );
    return res.json({ rankings: rows.reverse() });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/businesses/:businessId/keywords/:keywordId/refresh',
  authenticate,
  requireBusinessAccess,
  async (req, res, next) => {
    try {
      const { keywordId, businessId } = req.params;
      const { rows } = await pool.query(
        'SELECT * FROM keywords WHERE id = $1 AND business_id = $2',
        [keywordId, businessId]
      );
      const keyword = rows[0];
      if (!keyword) {
        return res.status(404).json({ message: 'Keyword not found' });
      }
      await keywordService.refreshRankingForKeyword(keyword.id, req.business, keyword.keyword);
      return res.json({ status: 'queued' });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
