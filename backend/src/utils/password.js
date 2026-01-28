const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const comparePassword = (password, hashed) => bcrypt.compare(password, hashed);

module.exports = {
  hashPassword,
  comparePassword
};
