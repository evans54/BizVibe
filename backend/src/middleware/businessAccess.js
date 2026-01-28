const businessService = require('../services/businessService');

const requireBusinessAccess = async (req, res, next) => {
  try {
    const businessId = req.params.businessId;
    const business = await businessService.getBusinessForUser(businessId, req.user);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    req.business = business;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requireBusinessAccess
};
