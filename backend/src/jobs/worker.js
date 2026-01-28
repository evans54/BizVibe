const { Worker } = require('bullmq');
const logger = require('../utils/logger');
const redis = require('../utils/redis');
const businessService = require('../services/businessService');
const keywordService = require('../services/keywordService');
const reviewService = require('../services/reviewService');
const suggestionService = require('../services/suggestionService');
const reportService = require('../services/reportService');
const emailService = require('../services/emailService');
const userService = require('../services/userService');
const backupService = require('../services/backupService');

const connection = redis ? redis.options : undefined;

const sendReportEmail = async (business, report) => {
  const user = await userService.getUserById(business.userId);
  if (!user || !user.email) {
    return;
  }
  const subject = `BizVibe ${report.report_type.replace('_', ' ')} report`;
  const html = `<p>Hello ${user.name},</p>
    <p>Your ${report.report_type.replace('_', ' ')} report is ready.</p>
    <p>Log in to BizVibe to view insights and export PDF/CSV.</p>`;
  await emailService.sendEmail({
    to: user.email,
    subject,
    html,
    text: `Your ${report.report_type} report is ready. Log in to BizVibe.`
  });
};

const handlers = {
  rank_check: async ({ businessId }) => {
    const business = await businessService.getBusinessById(businessId);
    if (!business) {
      return;
    }
    await keywordService.refreshRankingsForBusiness(businessId, business);
  },
  review_request: async ({ businessId, payload }) => {
    await reviewService.sendScheduledReviewRequests(businessId, payload || {});
  },
  seo_suggestion: async ({ businessId }) => {
    const suggestions = await suggestionService.generateSuggestions(businessId);
    await reportService.createSuggestionReport(businessId, suggestions);
  },
  report_weekly: async ({ businessId }) => {
    const report = await reportService.generateReport(businessId, 'weekly');
    const business = await businessService.getBusinessById(businessId);
    if (business) {
      await sendReportEmail(business, report);
    }
  },
  report_monthly: async ({ businessId }) => {
    const report = await reportService.generateReport(businessId, 'monthly');
    const business = await businessService.getBusinessById(businessId);
    if (business) {
      await sendReportEmail(business, report);
    }
  },
  backup: async () => {
    await backupService.runIfDue();
  }
};

const worker = new Worker(
  'automation',
  async (job) => {
    const handler = handlers[job.name];
    if (!handler) {
      logger.warn('Unknown job type', { name: job.name });
      return;
    }
    await handler(job.data || {});
  },
  { connection }
);

worker.on('completed', (job) => {
  logger.info('Automation job completed', { jobId: job.id, name: job.name });
});

worker.on('failed', (job, error) => {
  logger.error('Automation job failed', { jobId: job?.id, name: job?.name, error });
});

logger.info('Automation worker started');
