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
  res.status(200).json({ status: 'ok', services: { frontend: 'ok', backend: 'ok' } });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple API routes for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Frontend fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BizVibe full-stack server listening on port ${PORT}`);
});
