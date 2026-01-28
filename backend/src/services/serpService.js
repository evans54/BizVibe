const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

const findRankFromResults = (results, businessName) => {
  if (!results || !results.length) {
    return null;
  }
  const lowerName = (businessName || '').toLowerCase();
  const matchIndex = results.findIndex((entry) =>
    entry?.title?.toLowerCase().includes(lowerName) ||
    entry?.name?.toLowerCase().includes(lowerName)
  );
  return matchIndex >= 0 ? matchIndex + 1 : null;
};

const fetchRankWithSerpApi = async (keyword, business) => {
  if (!env.serpApiKey) {
    logger.warn('SERP API key missing');
    return null;
  }

  const location = business?.address || 'Nairobi, Kenya';
  const response = await axios.get('https://serpapi.com/search.json', {
    params: {
      api_key: env.serpApiKey,
      engine: 'google',
      q: keyword,
      location
    }
  });

  const data = response.data || {};
  const localRank = findRankFromResults(data.local_results, business?.name);
  if (localRank) {
    return localRank;
  }
  const organicRank = findRankFromResults(data.organic_results, business?.name);
  return organicRank;
};

const fetchRankWithBrightLocal = async () => {
  logger.warn('BrightLocal integration not configured, returning null');
  return null;
};

const fetchRankForKeyword = async (keyword, business) => {
  try {
    if (env.serpApiProvider === 'brightlocal') {
      return await fetchRankWithBrightLocal(keyword, business);
    }
    return await fetchRankWithSerpApi(keyword, business);
  } catch (error) {
    logger.error('Failed to fetch SERP rank', error);
    return null;
  }
};

module.exports = {
  fetchRankForKeyword
};
