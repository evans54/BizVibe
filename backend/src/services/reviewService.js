const pool = require('../db/pool');
const notificationService = require('./notificationService');

const listReviews = async (businessId) => {
  const { rows } = await pool.query(
    'SELECT id, customer_name, rating, review_text, source, created_at FROM reviews WHERE business_id = $1 ORDER BY created_at DESC',
    [businessId]
  );
  return rows;
};

const createReview = async (businessId, payload) => {
  const { rows } = await pool.query(
    `INSERT INTO reviews (business_id, customer_name, rating, review_text, source)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, customer_name, rating, review_text, source, created_at`,
    [
      businessId,
      payload.customerName || null,
      payload.rating,
      payload.reviewText || null,
      payload.source || 'manual'
    ]
  );
  return rows[0];
};

const aggregateReviews = async (businessId) => {
  const { rows } = await pool.query(
    `SELECT AVG(rating) AS average_rating, COUNT(*) AS total_reviews
     FROM reviews
     WHERE business_id = $1`,
    [businessId]
  );
  const summary = rows[0] || { average_rating: 0, total_reviews: 0 };

  const { rows: breakdownRows } = await pool.query(
    `SELECT rating, COUNT(*)::int AS count
     FROM reviews
     WHERE business_id = $1
     GROUP BY rating
     ORDER BY rating DESC`,
    [businessId]
  );

  return {
    averageRating: Number(summary.average_rating || 0),
    totalReviews: Number(summary.total_reviews || 0),
    breakdown: breakdownRows
  };
};

const sendReviewRequest = async (businessId, payload) => {
  const message = payload.message || `Thanks for choosing us! Please leave a review: ${payload.reviewLink}`;
  const channel = payload.channel || 'sms';
  const recipient = payload.recipient;

  if (channel === 'whatsapp') {
    return notificationService.sendWhatsapp(recipient, message, businessId);
  }
  return notificationService.sendSms(recipient, message, businessId);
};

const sendScheduledReviewRequests = async (businessId, payload) => {
  if (!payload || !payload.recipients) {
    return { sent: 0 };
  }
  const results = [];
  for (const recipient of payload.recipients) {
    results.push(
      await sendReviewRequest(businessId, {
        ...payload,
        recipient,
        channel: payload.channel || 'sms'
      })
    );
  }
  return { sent: results.length };
};

module.exports = {
  listReviews,
  createReview,
  aggregateReviews,
  sendReviewRequest,
  sendScheduledReviewRequests
};
