const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// GET /api/audit
// Fetch audit logs with pagination, only accessible to admins
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('performedBy', 'name email role')
        .populate('item', 'itemName segment company')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments()
    ]);

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
