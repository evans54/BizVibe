const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireBusinessAccess } = require('../middleware/businessAccess');
const reviewService = require('../services/reviewService');

const router = express.Router();

router.get('/businesses/:businessId/reviews', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const reviews = await reviewService.listReviews(req.business.id);
    return res.json({ reviews });
  } catch (error) {
    return next(error);
  }
});

router.get(
  '/businesses/:businessId/reviews/summary',
  authenticate,
  requireBusinessAccess,
  async (req, res, next) => {
    try {
      const summary = await reviewService.aggregateReviews(req.business.id);
      return res.json({ summary });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/businesses/:businessId/reviews', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const { customerName, rating, reviewText, source } = req.body;
    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }
    const review = await reviewService.createReview(req.business.id, {
      customerName,
      rating,
      reviewText,
      source
    });
    return res.status(201).json({ review });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/businesses/:businessId/review-requests',
  authenticate,
  requireBusinessAccess,
  async (req, res, next) => {
    try {
      const { recipient, message, channel, reviewLink } = req.body;
      if (!recipient || !reviewLink) {
        return res.status(400).json({ message: 'Recipient and reviewLink are required' });
      }
      const response = await reviewService.sendReviewRequest(req.business.id, {
        recipient,
        message,
        channel,
        reviewLink
      });
      return res.json({ status: response.status, channel: response.channel });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
