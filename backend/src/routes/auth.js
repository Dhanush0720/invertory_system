const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isValidEmail, normalizeEmail, sanitizeText } = require('../utils/validation');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = sanitizeText(req.body.password, { max: 200 });
    if (!email || !password || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide valid login credentials' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is pending administrator approval. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Unable to process login right now.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const name = sanitizeText(req.body.name, { allowEmpty: false, max: 120 });
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'A valid email address is required' });

    const { isStrongPassword } = require('../utils/validation');
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 10 characters and include upper, lower, number, and symbol' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email address already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: 'viewer',
      isActive: false // Pending approval
    });

    res.status(201).json({
      message: 'Registration successful! Your account is pending administrator approval.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const crypto = require('crypto');
    const email = normalizeEmail(req.body.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({ message: 'If an account exists with that email, a password reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:3000'}/reset-password/${resetToken}`;
    const logMsg = `🔑 Nirvahana Password Recovery Link for ${user.email}:\n${resetUrl}`;
    
    console.log(logMsg);

    const { triggerWhatsAppNotification } = require('../utils/whatsappHelper');
    triggerWhatsAppNotification(null, null, null, logMsg).catch(err => {
      console.log('WhatsApp notification for recovery failed:', err.message);
    });

    res.json({ message: 'Recovery link generated. Please check server logs or admin WhatsApp.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const crypto = require('crypto');
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password recovery token.' });
    }

    const password = req.body.password;
    const { isStrongPassword } = require('../utils/validation');
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 10 characters and include upper, lower, number, and symbol' });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
