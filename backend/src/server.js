const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT, UPLOAD_DIR } = require('./config');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(UPLOAD_DIR));

// API Routes
app.use('/v1', require('./routes/auth'));
app.use('/v1/stories', require('./routes/stories'));
app.use('/v1/notifications', require('./routes/notifications'));
app.use('/v1/admin', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve frontend static files (hasil npm run build)
const frontendPath = path.join(__dirname, '../../docs');
app.use(express.static(frontendPath));

// SPA fallback — semua route non-API arahkan ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Story Map running at http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/v1\n`);
});
