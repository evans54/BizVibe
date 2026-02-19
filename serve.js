const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());

// Health check - MUST come before other routes
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Import and use backend API routes
let backendApp;
try {
  backendApp = require('./backend/src/app');
  // Mount the backend app on /api
  app.use('/api', backendApp);
  console.log('Backend API loaded successfully');
} catch (error) {
  console.log('Backend not available:', error.message);
  // Simple fallback API
  app.use('/api', (req, res) => {
    res.status(503).json({ error: 'Backend not available' });
  });
}

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Frontend fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BizVibe full-stack server listening on port ${PORT}`);
});
