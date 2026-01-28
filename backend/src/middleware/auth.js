const pool = require('../db/pool');
const { verifyAccessToken } = require('../utils/jwt');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Invalid authorization header' });
    }

    const payload = verifyAccessToken(token);
    const { rows } = await pool.query(
      'SELECT id, name, email, role, mfa_enabled FROM users WHERE id = $1',
      [payload.sub]
    );

    if (!rows[0]) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return next(error);
  }
};

module.exports = {
  authenticate
};
