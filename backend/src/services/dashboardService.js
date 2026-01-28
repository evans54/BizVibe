const businessService = require('./businessService');
const keywordService = require('./keywordService');
const reviewService = require('./reviewService');
const suggestionService = require('./suggestionService');
const reportService = require('./reportService');

const getDashboard = async (businessId) => {
  const [business, keywords, reviews, suggestions, reports] = await Promise.all([
    businessService.getBusinessById(businessId),
    keywordService.getKeywordsWithTrends(businessId),
    reviewService.aggregateReviews(businessId),
    suggestionService.generateSuggestions(businessId),
    reportService.listReports(businessId, 5)
  ]);

  return {
    business,
    keywords,
    reviews,
    suggestions,
    reports
  };
};

module.exports = {
  getDashboard
};
