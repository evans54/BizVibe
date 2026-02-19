const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Health check - FIRST route, instant response
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Frontend fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
