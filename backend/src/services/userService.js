const pool = require('../db/pool');
const { hashPassword } = require('../utils/password');

const sanitizeEmail = (email) => email.trim().toLowerCase();

const createUser = async ({ name, email, password, role }) => {
  const normalizedEmail = sanitizeEmail(email);
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, mfa_enabled, created_at`,
    [name.trim(), normalizedEmail, passwordHash, role || 'business_user']
  );
  return rows[0];
};

const findUserByEmail = async (email) => {
  const normalizedEmail = sanitizeEmail(email);
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [normalizedEmail]
  );
  return rows[0];
};

const getUserById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, mfa_enabled, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
};

const getUserWithSecrets = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, mfa_enabled, mfa_secret, mfa_pending_secret FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
};

const listUsers = async () => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, mfa_enabled, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
};

const setMfaPendingSecret = async (userId, secret) => {
  await pool.query(
    'UPDATE users SET mfa_pending_secret = $1, updated_at = NOW() WHERE id = $2',
    [secret, userId]
  );
};

const enableMfa = async (userId, secret) => {
  await pool.query(
    `UPDATE users
     SET mfa_enabled = TRUE, mfa_secret = $1, mfa_pending_secret = NULL, updated_at = NOW()
     WHERE id = $2`,
    [secret, userId]
  );
};

const disableMfa = async (userId) => {
  await pool.query(
    `UPDATE users
     SET mfa_enabled = FALSE, mfa_secret = NULL, mfa_pending_secret = NULL, updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
};

module.exports = {
  createUser,
  findUserByEmail,
  getUserById,
  getUserWithSecrets,
  listUsers,
  setMfaPendingSecret,
  enableMfa,
  disableMfa
};
