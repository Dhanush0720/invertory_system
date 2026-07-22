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

module.exports = router;
