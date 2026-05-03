require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();

// ── Middleware ──────────────────────────────────────────────
// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads dir exists
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
app.use('/uploads', express.static(path.resolve(uploadPath)));

// ── Database ────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('   → Check your MONGODB_URI in .env');
    process.exit(1);
  });

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/stands',        require('./routes/stands'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    features: {
      googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
      twilio:     !!process.env.TWILIO_ACCOUNT_SID,
      whatsapp:   !!process.env.TWILIO_WHATSAPP_NUMBER,
    }
  });
});

// ── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Village Office Server running on http://localhost:${PORT}`);
  console.log(`   Google Maps: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ enabled' : '⚠️  not configured'}`);
  console.log(`   Twilio SMS:  ${process.env.TWILIO_ACCOUNT_SID  ? '✅ enabled' : '⚠️  not configured'}`);
});
