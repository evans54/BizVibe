const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const Sentry = require('@sentry/node');
const env = require('./config/env');
const routes = require('./routes');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const metrics = require('./utils/metrics');

const app = express();

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: 0.1
  });
  app.use(Sentry.Handlers.requestHandler());
}

app.use(helmet());
app.use(
  cors({
    origin: env.appBaseUrl || true, // Allow all origins in production
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const routePath = req.route?.path
      ? `${req.baseUrl || ''}${req.route.path}`
      : req.path;
    metrics.httpRequestDurationSeconds
      .labels(req.method, routePath, res.statusCode)
      .observe(duration);
  });
  next();
});

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/metrics', async (req, res, next) => {
  try {
    res.setHeader('Content-Type', metrics.register.contentType);
    const payload = await metrics.register.metrics();
    return res.send(payload);
  } catch (error) {
    return next(error);
  }
});

app.use('/api', routes);

if (env.sentryDsn) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use(errorHandler);

module.exports = app;
