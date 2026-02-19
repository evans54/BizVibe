const http = require('http');
const fs = require('fs');
const path = require('path');

// Lightning-fast health check - no processing at all
const server = http.createServer((req, res) => {
  // Health check - INSTANT response
  if (req.url === '/health') {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache'
    });
    res.end('OK');
    return;
  }

  // API status check
  if (req.url === '/api/status') {
    const backendStatus = backendApp ? 'ready' : 'loading';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      backend: backendStatus,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Proxy to backend if available
  if (req.url.startsWith('/api') && backendApp) {
    try {
      backendApp(req, res);
      return;
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend error', message: error.message }));
      return;
    }
  }

  // API fallback if backend not ready
  if (req.url.startsWith('/api')) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Backend not ready',
      message: 'Backend is starting up, please try again in a few moments',
      status: 'loading'
    }));
    return;
  }

  // Serve frontend files
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon'
      }[ext] || 'text/plain';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Load backend asynchronously in background
let backendApp = null;
let backendLoading = true;

setTimeout(() => {
  try {
    console.log('🔄 Loading backend...');

    // Set environment variables if not set
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-jwt-refresh-secret';
    process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-encryption-key';

    backendApp = require('./backend/src/app');
    backendLoading = false;
    console.log('✅ Backend loaded successfully! API endpoints now available.');
  } catch (error) {
    console.log('❌ Backend loading failed:', error.message);
    console.log('💡 Make sure to set JWT_SECRET, JWT_REFRESH_SECRET, and ENCRYPTION_KEY in Railway variables');
    backendLoading = false;
  }
}, 1000); // Load backend 1 second after server starts

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BizVibe server started on port ${PORT}`);
  console.log(`⚡ Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 Frontend: http://localhost:${PORT}`);
  console.log(`🔄 Backend loading in background...`);
});
