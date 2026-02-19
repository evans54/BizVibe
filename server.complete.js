const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Health check - FIRST route, guaranteed to work
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Backend API integration
let backendLoaded = false;
let backendError = null;

try {
  // Set required environment variables with defaults
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PORT = process.env.PORT || '8080';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-healthcheck-only';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-jwt-refresh-secret-for-healthcheck-only';
  process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-encryption-key-for-healthcheck-only';

  const backendApp = require('./backend/src/app');
  app.use('/api', backendApp);
  backendLoaded = true;
  console.log('✅ Backend API loaded successfully');
} catch (error) {
  backendError = error.message;
  console.log('⚠️  Backend loading failed:', error.message);
  console.log('🔄 Using fallback API mode');

  // Fallback API endpoints
  app.use('/api', (req, res) => {
    res.status(503).json({
      error: 'Backend service unavailable',
      message: 'Please configure environment variables and try again',
      details: backendError
    });
  });
}

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Frontend fallback - serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Frontend not available');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BizVibe server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 Backend loaded: ${backendLoaded}`);
  if (!backendLoaded) {
    console.log(`⚠️  Backend error: ${backendError}`);
    console.log(`💡 To enable backend: Set JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY in Railway`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
