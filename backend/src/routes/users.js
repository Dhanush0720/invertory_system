const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES, isStrongPassword, isValidEmail, normalizeEmail, sanitizeText } = require('../utils/validation');

async function ensureActiveAdminRemains(targetUserId) {
  const remainingAdmins = await User.countDocuments({
    role: 'admin',
    isActive: true,
    _id: { $ne: targetUserId }
  });
  return remainingAdmins > 0;
}

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const name = sanitizeText(req.body.name, { allowEmpty: false, max: 120 });
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const role = req.body.role;

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'A valid email is required' });
    if (!USER_ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role selected' });
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 10 characters and include upper, lower, number, and symbol' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const existingUser = await User.findById(req.params.id).select('role isActive');
    if (!existingUser) return res.status(404).json({ message: 'User not found' });

    const updates = {};
    if (req.body.name !== undefined) {
      const name = sanitizeText(req.body.name, { allowEmpty: false, max: 120 });
      if (!name) return res.status(400).json({ message: 'Name cannot be empty' });
      updates.name = name;
    }

    if (req.body.role !== undefined) {
      if (!USER_ROLES.includes(req.body.role)) return res.status(400).json({ message: 'Invalid role selected' });
      updates.role = req.body.role;
    }

    if (req.body.isActive !== undefined) {
      updates.isActive = Boolean(req.body.isActive);
    }

    if (req.body.password) {
      if (!isStrongPassword(req.body.password)) {
        return res.status(400).json({ message: 'Password must be at least 10 characters and include upper, lower, number, and symbol' });
      }
      updates.password = await bcrypt.hash(req.body.password, 12);
    }

    const demotingAdmin = existingUser.role === 'admin' && updates.role && updates.role !== 'admin';
    const deactivatingAdmin = existingUser.role === 'admin' && updates.isActive === false;
    if ((demotingAdmin || deactivatingAdmin) && !(await ensureActiveAdminRemains(req.params.id))) {
      return res.status(400).json({ message: 'At least one active admin account must remain.' });
    }

    if (req.params.id === req.user._id.toString() && updates.isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id).select('role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin' && !(await ensureActiveAdminRemains(req.params.id))) {
      return res.status(400).json({ message: 'At least one active admin account must remain.' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
