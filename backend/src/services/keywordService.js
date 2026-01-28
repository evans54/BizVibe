const pool = require('../db/pool');
const serpService = require('./serpService');

const addKeyword = async (businessId, keyword) => {
  const { rows } = await pool.query(
    `INSERT INTO keywords (business_id, keyword)
     VALUES ($1, $2)
     RETURNING id, business_id, keyword, last_rank, created_at`,
    [businessId, keyword.trim()]
  );
  return rows[0];
};

const listKeywords = async (businessId) => {
  const { rows } = await pool.query(
    'SELECT id, business_id, keyword, last_rank, created_at FROM keywords WHERE business_id = $1 ORDER BY created_at DESC',
    [businessId]
  );
  return rows;
};

const listKeywordRankings = async (keywordId, limit = 30) => {
  const { rows } = await pool.query(
    `SELECT rank, checked_at
     FROM keyword_rankings
     WHERE keyword_id = $1
     ORDER BY checked_at DESC
     LIMIT $2`,
    [keywordId, limit]
  );
  return rows;
};

const recordRanking = async (keywordId, rank) => {
  await pool.query(
    'INSERT INTO keyword_rankings (keyword_id, rank) VALUES ($1, $2)',
    [keywordId, rank]
  );
  await pool.query('UPDATE keywords SET last_rank = $1, updated_at = NOW() WHERE id = $2', [rank, keywordId]);
};

const getKeywordsWithTrends = async (businessId) => {
  const keywords = await listKeywords(businessId);
  const trends = await Promise.all(
    keywords.map(async (keyword) => {
      const rankings = await listKeywordRankings(keyword.id, 14);
      return {
        ...keyword,
        rankings: rankings.reverse()
      };
    })
  );
  return trends;
};

const refreshRankingsForBusiness = async (businessId, business) => {
  const keywords = await listKeywords(businessId);
  for (const keyword of keywords) {
    const rank = await serpService.fetchRankForKeyword(keyword.keyword, business);
    if (rank) {
      await recordRanking(keyword.id, rank);
    }
  }
};

const refreshRankingForKeyword = async (keywordId, business, keyword) => {
  const rank = await serpService.fetchRankForKeyword(keyword, business);
  if (rank) {
    await recordRanking(keywordId, rank);
  }
};

module.exports = {
  addKeyword,
  listKeywords,
  listKeywordRankings,
  recordRanking,
  getKeywordsWithTrends,
  refreshRankingsForBusiness,
  refreshRankingForKeyword
};
