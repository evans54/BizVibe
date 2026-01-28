const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

const buildHeaders = (accessToken) => {
  const headers = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

const mapProfile = (profile) => {
  if (!profile) {
    return null;
  }
  const address = profile.address
    ? `${profile.address.addressLines?.join(' ') || ''} ${profile.address.locality || ''} ${profile.address.regionCode || ''}`.trim()
    : null;
  return {
    name: profile.title || profile.name,
    category: profile.primaryCategory?.displayName || null,
    address,
    phone: profile.phoneNumbers?.primaryPhone || null,
    website: profile.websiteUri || null
  };
};

const fetchBusinessProfile = async (googleProfileId, accessToken) => {
  if (!googleProfileId) {
    return null;
  }
  const url = `${env.googleGbpBaseUrl}/${googleProfileId}`;
  const response = await axios.get(url, {
    headers: buildHeaders(accessToken),
    params: env.googleGbpApiKey ? { key: env.googleGbpApiKey } : undefined
  });
  return mapProfile(response.data);
};

const updateBusinessProfile = async (googleProfileId, accessToken, updates) => {
  if (!googleProfileId) {
    return null;
  }
  const url = `${env.googleGbpBaseUrl}/${googleProfileId}`;
  const response = await axios.patch(url, updates, {
    headers: buildHeaders(accessToken),
    params: env.googleGbpApiKey ? { key: env.googleGbpApiKey, updateMask: Object.keys(updates).join(',') } : undefined
  });
  logger.info('Updated GBP profile', { googleProfileId });
  return mapProfile(response.data);
};

module.exports = {
  fetchBusinessProfile,
  updateBusinessProfile
};
