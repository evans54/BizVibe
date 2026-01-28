const businessService = require('./businessService');
const keywordService = require('./keywordService');
const reviewService = require('./reviewService');

const generateSuggestions = async (businessId) => {
  const business = await businessService.getBusinessById(businessId);
  if (!business) {
    return [];
  }

  const suggestions = [];

  if (!business.googleProfileId) {
    suggestions.push({
      title: 'Link your Google Business Profile',
      action: 'Connect your GBP to sync business data and post updates.',
      priority: 'high'
    });
  }

  const missingFields = [];
  if (!business.category) missingFields.push('category');
  if (!business.address) missingFields.push('address');
  if (!business.phone) missingFields.push('phone');
  if (!business.website) missingFields.push('website');

  if (missingFields.length) {
    suggestions.push({
      title: 'Complete your business profile',
      action: `Add missing details: ${missingFields.join(', ')}.`,
      priority: 'high'
    });
  }

  suggestions.push({
    title: 'Add fresh photos weekly',
    action: 'Upload new storefront, team, and product photos to improve local relevance.',
    priority: 'medium'
  });

  const keywords = await keywordService.listKeywords(businessId);
  if (!keywords.length) {
    suggestions.push({
      title: 'Start tracking local keywords',
      action: 'Add phrases customers in Nairobi use to find your business.',
      priority: 'high'
    });
  } else {
    const lowRanked = keywords.filter((keyword) => keyword.last_rank && keyword.last_rank > 10);
    if (lowRanked.length) {
      suggestions.push({
        title: 'Improve low-ranking keywords',
        action: `Focus on: ${lowRanked.map((item) => item.keyword).slice(0, 5).join(', ')}`,
        priority: 'medium'
      });
    }
  }

  const reviewSummary = await reviewService.aggregateReviews(businessId);
  if (reviewSummary.totalReviews < 20) {
    suggestions.push({
      title: 'Increase your review volume',
      action: 'Trigger automated review requests after every customer visit.',
      priority: 'medium'
    });
  }

  if (reviewSummary.averageRating && reviewSummary.averageRating < 4.2) {
    suggestions.push({
      title: 'Respond to recent reviews',
      action: 'Address concerns and encourage loyal customers to update reviews.',
      priority: 'high'
    });
  }

  suggestions.push({
    title: 'Monitor top competitors',
    action: 'Track the top 3 businesses ranking in your target keywords and adjust offers.',
    priority: 'low'
  });

  return suggestions;
};

module.exports = {
  generateSuggestions
};
