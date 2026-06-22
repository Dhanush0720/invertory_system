const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const dns = require('node:dns');

// Force IPv4 to avoid common IPv6 resolution issues on Windows
dns.setDefaultResultOrder('ipv4first');
// Use Google's Public DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
app.disable('x-powered-by');

const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isDevLanOrigin(origin = '') {
  return /^https?:\/\/((localhost|127\.0\.0\.1)|((192\.168|10)\.\d{1,3}\.\d{1,3}\.\d{1,3})|(172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}))(:\d+)?$/i.test(origin);
}

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  if (frontendOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_CORS_ALLOW_ALL === 'true') return true;
  if (process.env.NODE_ENV !== 'production' && isDevLanOrigin(origin)) return true;
  return false;
}

const apiLimiter = rateLimit({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many login attempts. Please try again later.' }
});

const { runAutonomousAgent } = require('./jobs/agentJob');

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin(origin, callback) {
    if (isAllowedCorsOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));
app.use(apiLimiter);
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use('/api/auth/login', authLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/distributions', require('./routes/distributions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard').router);
app.use('/api/master', require('./routes/masterRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/agents', require('./routes/agentRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/audit', require('./routes/audit'));

app.get('/', (req, res) => res.json({ message: 'College Inventory API Running' }));
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
  return next();
});

function validateRequiredEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function seedAdmin() {
  if (process.env.ALLOW_DEFAULT_ADMIN_SEED !== 'true') return;
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping default admin seed in production for security.');
    return;
  }

  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const email = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@college.edu').trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!password || password.length < 10) {
    console.warn('Skipping default admin seed because DEFAULT_ADMIN_PASSWORD is missing or too short.');
    return;
  }

  const existing = await User.findOne({ role: 'admin' });
  if (!existing) {
    const hashed = await bcrypt.hash(password, 12);
    await User.create({
      name: 'Admin',
      email,
      password: hashed,
      role: 'admin'
    });
    console.log(`Seeded default admin user for ${email}`);
  }
}

validateRequiredEnv();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await seedAdmin();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Triggering Agentic AI initialization...');
      runAutonomousAgent();
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
