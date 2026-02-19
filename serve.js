const express = require('express');
const path = require('path');
const cors = require('cors');
const env = require('./backend/src/config/env');

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());

// Health check - MUST come before other routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', services: { frontend: 'ok', backend: 'ok' } });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes - serve backend API
app.use('/api', require('./backend/src/app'));

// Frontend fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`BizVibe full-stack server listening on port ${PORT}`);
});
