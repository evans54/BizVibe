const pool = require('../db/pool');
const businessService = require('./businessService');
const keywordService = require('./keywordService');
const reviewService = require('./reviewService');
const suggestionService = require('./suggestionService');

const createReport = async (businessId, reportType, content) => {
  const { rows } = await pool.query(
    `INSERT INTO reports (business_id, report_type, content)
     VALUES ($1, $2, $3)
     RETURNING id, business_id, report_type, content, created_at`,
    [businessId, reportType, content]
  );
  return rows[0];
};

const listReports = async (businessId, limit = 12) => {
  const { rows } = await pool.query(
    `SELECT id, business_id, report_type, content, created_at
     FROM reports
     WHERE business_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [businessId, limit]
  );
  return rows;
};

const getReportById = async (reportId) => {
  const { rows } = await pool.query(
    'SELECT id, business_id, report_type, content, created_at FROM reports WHERE id = $1',
    [reportId]
  );
  return rows[0];
};

const generateReport = async (businessId, reportType) => {
  const [business, keywords, reviewSummary, suggestions] = await Promise.all([
    businessService.getBusinessById(businessId),
    keywordService.getKeywordsWithTrends(businessId),
    reviewService.aggregateReviews(businessId),
    suggestionService.generateSuggestions(businessId)
  ]);

  const content = {
    generatedAt: new Date().toISOString(),
    reportType,
    business,
    keywords,
    reviews: reviewSummary,
    suggestions
  };

  return createReport(businessId, reportType, content);
};

const createSuggestionReport = async (businessId, suggestions) =>
  createReport(businessId, 'seo_suggestions', {
    generatedAt: new Date().toISOString(),
    suggestions
  });

module.exports = {
  createReport,
  listReports,
  getReportById,
  generateReport,
  createSuggestionReport
};
