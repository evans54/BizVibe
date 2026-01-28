const pool = require('../db/pool');
const { encrypt, decrypt } = require('../utils/crypto');
const gbpService = require('./gbpService');

const mapBusinessRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    userId: row.user_id,
    googleProfileId: row.google_profile_id,
    name: row.name,
    category: row.category,
    address: row.address,
    phone: row.phone,
    website: row.website,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const createBusiness = async (userId, payload) => {
  const { rows } = await pool.query(
    `INSERT INTO businesses (user_id, name, category, address, phone, website)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      payload.name,
      payload.category || null,
      payload.address || null,
      payload.phone || null,
      payload.website || null
    ]
  );

  const business = mapBusinessRow(rows[0]);
  const automationService = require('./automationService');
  await automationService.createDefaultTasks(business.id);
  return business;
};

const updateBusiness = async (businessId, payload) => {
  const { rows } = await pool.query(
    `UPDATE businesses
     SET name = $1,
         category = $2,
         address = $3,
         phone = $4,
         website = $5,
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      payload.name,
      payload.category || null,
      payload.address || null,
      payload.phone || null,
      payload.website || null,
      businessId
    ]
  );
  return mapBusinessRow(rows[0]);
};

const listBusinessesForUser = async (user) => {
  const query = user.role === 'admin'
    ? 'SELECT * FROM businesses ORDER BY created_at DESC'
    : 'SELECT * FROM businesses WHERE user_id = $1 ORDER BY created_at DESC';
  const params = user.role === 'admin' ? [] : [user.id];
  const { rows } = await pool.query(query, params);
  return rows.map(mapBusinessRow);
};

const getBusinessById = async (businessId) => {
  const { rows } = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
  return mapBusinessRow(rows[0]);
};

const getBusinessForUser = async (businessId, user) => {
  const query = user.role === 'admin'
    ? 'SELECT * FROM businesses WHERE id = $1'
    : 'SELECT * FROM businesses WHERE id = $1 AND user_id = $2';
  const params = user.role === 'admin' ? [businessId] : [businessId, user.id];
  const { rows } = await pool.query(query, params);
  return rows[0] ? mapBusinessRow(rows[0]) : null;
};

const linkGoogleProfile = async (businessId, { googleProfileId, accessToken, refreshToken }) => {
  const profile = await gbpService.fetchBusinessProfile(googleProfileId, accessToken);
  const updates = {
    googleProfileId,
    name: profile?.name,
    category: profile?.category,
    address: profile?.address,
    phone: profile?.phone,
    website: profile?.website
  };

  const { rows } = await pool.query(
    `UPDATE businesses
     SET google_profile_id = $1,
         name = COALESCE($2, name),
         category = COALESCE($3, category),
         address = COALESCE($4, address),
         phone = COALESCE($5, phone),
         website = COALESCE($6, website),
         google_access_token = $7,
         google_refresh_token = $8,
         updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [
      updates.googleProfileId,
      updates.name,
      updates.category,
      updates.address,
      updates.phone,
      updates.website,
      accessToken ? encrypt(accessToken) : null,
      refreshToken ? encrypt(refreshToken) : null,
      businessId
    ]
  );

  return mapBusinessRow(rows[0]);
};

const getGoogleTokens = async (businessId) => {
  const { rows } = await pool.query(
    'SELECT google_access_token, google_refresh_token FROM businesses WHERE id = $1',
    [businessId]
  );
  const record = rows[0];
  if (!record) {
    return null;
  }
  return {
    accessToken: decrypt(record.google_access_token),
    refreshToken: decrypt(record.google_refresh_token)
  };
};

module.exports = {
  createBusiness,
  updateBusiness,
  listBusinessesForUser,
  getBusinessById,
  getBusinessForUser,
  linkGoogleProfile,
  getGoogleTokens
};
