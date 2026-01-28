const express = require('express');
const authRoutes = require('./authRoutes');
const businessRoutes = require('./businessRoutes');
const keywordRoutes = require('./keywordRoutes');
const reviewRoutes = require('./reviewRoutes');
const reportRoutes = require('./reportRoutes');
const automationRoutes = require('./automationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const exportRoutes = require('./exportRoutes');
const adminRoutes = require('./adminRoutes');
const suggestionRoutes = require('./suggestionRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/businesses', businessRoutes);
router.use(keywordRoutes);
router.use(reviewRoutes);
router.use(reportRoutes);
router.use(automationRoutes);
router.use(dashboardRoutes);
router.use(exportRoutes);
router.use(adminRoutes);
router.use(suggestionRoutes);

module.exports = router;
