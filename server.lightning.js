const http = require('http');

// Ultra-fast health check server - no dependencies, no processing
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'close'
    });
    res.end('OK');
    return;
  }

  // Minimal static response for root
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>BizVibe Loading...</h1><p>Backend starting up...</p>');
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Health server ready on port ${PORT}`);
});
