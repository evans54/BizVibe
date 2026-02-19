const express = require('express');
const app = express();

// Health check - ONLY endpoint needed for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server on port ${PORT}`);
});
