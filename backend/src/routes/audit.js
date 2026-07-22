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

    const { actionType, search } = req.query;
    let query = {};

    if (actionType) {
      query.actionType = actionType;
    }

    if (search) {
      const Item = require('../models/Item');
      const User = require('../models/User');

      const matchingItems = await Item.find({ itemName: { $regex: search, $options: 'i' } }).select('_id');
      const itemIds = matchingItems.map(i => i._id);

      const matchingUsers = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { item: { $in: itemIds } },
        { performedBy: { $in: userIds } }
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'name email role')
        .populate('item', 'itemName segment company')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query)
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
