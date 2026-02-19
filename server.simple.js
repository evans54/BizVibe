const express = require('express');
const path = require('path');

const app = express();

// Health check - FIRST route, guaranteed to work
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Basic API status
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Placeholder auth endpoints
app.post('/api/auth/register', (req, res) => {
  res.status(200).json({
    message: 'Registration endpoint available',
    note: 'Backend will be available after environment setup'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.status(200).json({
    message: 'Login endpoint available',
    note: 'Backend will be available after environment setup'
  });
});

// Static file serving
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Catch-all for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send('Frontend not available');
    }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
