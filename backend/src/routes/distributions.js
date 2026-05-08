const express = require('express');
const router = express.Router();
const Distribution = require('../models/Distribution');
const Item = require('../models/Item');
const { protect, authorize } = require('../middleware/auth');
const { parsePositiveNumber, sanitizeDistributionPayload } = require('../utils/validation');

// GET /api/distributions
router.get('/', protect, async (req, res) => {
  try {
    const { itemId, department } = req.query;
    let query = {};
    if (itemId) query.item = itemId;
    if (department) query.distributedToDepartment = { $regex: department, $options: 'i' };

    const distributions = await Distribution.find(query)
      .populate('item', 'itemName category uom')
      .populate('distributedBy', 'name')
      .sort('-dateOfDistribution');
    res.json(distributions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/distributions — admin & staff only
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { payload, error } = sanitizeDistributionPayload(req.body);
    if (error) return res.status(400).json({ message: error });
    const requestedQty = payload.quantityDistributed;

    const item = await Item.findById(payload.item);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Check available stock
    const distResult = await Distribution.aggregate([
      { $match: { item: item._id } },
      { $group: { _id: null, total: { $sum: '$quantityDistributed' } } }
    ]);
    const alreadyDistributed = distResult[0]?.total || 0;
    const remaining = (item.quantityPurchased || 0) - alreadyDistributed;

    if (requestedQty > remaining) {
      return res.status(400).json({
        message: `Cannot distribute ${requestedQty}. Only ${remaining} units available.`
      });
    }

    const distribution = await Distribution.create({
      ...payload,
      distributedBy: req.user._id
    });

    const populated = await distribution.populate('item', 'itemName category');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/distributions/:id — admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const dist = await Distribution.findByIdAndDelete(req.params.id);
    if (!dist) return res.status(404).json({ message: 'Distribution record not found' });
    res.json({ message: 'Distribution deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/distributions/:id/return — admin & staff only
router.post('/:id/return', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const returnQty = parsePositiveNumber(req.body.quantityReturned);
    if (!returnQty) {
      return res.status(400).json({ message: 'Return quantity must be greater than 0' });
    }

    const dist = await Distribution.findById(req.params.id);
    if (!dist) return res.status(404).json({ message: 'Distribution record not found' });

    if (returnQty > dist.quantityDistributed) {
      return res.status(400).json({ message: `Cannot return ${returnQty}. Only ${dist.quantityDistributed} were distributed.` });
    }

    dist.quantityDistributed -= returnQty;
    dist.remarks = `${dist.remarks ? dist.remarks + ' | ' : ''}Returned ${returnQty} units on ${new Date().toLocaleDateString('en-IN')}`;
    
    // Auto-delete distribution if all items are returned
    if (dist.quantityDistributed === 0) {
      await dist.deleteOne();
      return res.json({ message: 'All items returned. Distribution record removed.' });
    } else {
      await dist.save();
      const populated = await dist.populate('item', 'itemName category');
      res.json(populated);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
