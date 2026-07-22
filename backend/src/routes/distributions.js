const express = require('express');
const router = express.Router();
const Distribution = require('../models/Distribution');
const Item = require('../models/Item');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const { parsePositiveNumber, sanitizeDistributionPayload } = require('../utils/validation');

// GET /api/distributions
router.get('/', protect, async (req, res) => {
  try {
    const { itemId, department, startDate, endDate, search } = req.query;
    let query = {};
    if (itemId) query.item = itemId;
    if (department) query.distributedToDepartment = { $regex: department, $options: 'i' };

    if (startDate || endDate) {
      query.dateOfDistribution = {};
      if (startDate) query.dateOfDistribution.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dateOfDistribution.$lte = end;
      }
    }

    if (search) {
      const Item = require('../models/Item');
      const items = await Item.find({ itemName: { $regex: search, $options: 'i' } }).select('_id');
      const itemIds = items.map(i => i._id);
      query.item = { $in: itemIds };
    }

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

    // Validate distribution date is not before purchase date
    if (item.dateOfPurchase && payload.dateOfDistribution) {
      const pDateStr = new Date(item.dateOfPurchase).toISOString().split('T')[0];
      const dDateStr = new Date(payload.dateOfDistribution).toISOString().split('T')[0];
      if (dDateStr < pDateStr) {
        return res.status(400).json({
          message: `Distribution date (${dDateStr}) cannot be earlier than the item's purchase date (${pDateStr}).`
        });
      }
    }


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

    // Update cached stock remaining in the Item document
    item.quantityRemaining = (item.quantityRemaining !== undefined ? item.quantityRemaining : remaining) - requestedQty;
    await item.save();

    const distribution = await Distribution.create({
      ...payload,
      distributedBy: req.user._id
    });

    await AuditLog.create({
      item: item._id,
      performedBy: req.user._id,
      actionType: 'DISTRIBUTED',
      notes: `Distributed ${requestedQty} units to ${payload.distributedToDepartment}`
    });

    // Calculate updated remaining stock to trigger real-time WhatsApp low stock alerts
    const newRemaining = remaining - requestedQty;
    const threshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : 5;
    if (newRemaining <= threshold) {
      const { triggerWhatsAppNotification } = require('../utils/whatsappHelper');
      triggerWhatsAppNotification(item.itemName, newRemaining, threshold).catch(e => {
        console.error('Failed to trigger WhatsApp alert:', e);
      });
    }

    const populated = await distribution.populate('item', 'itemName category');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/distributions/:id — admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const dist = await Distribution.findById(req.params.id);
    if (!dist) return res.status(404).json({ message: 'Distribution record not found' });

    // Restore cached remaining stock on deletion
    const item = await Item.findById(dist.item);
    if (item) {
      item.quantityRemaining = (item.quantityRemaining !== undefined ? item.quantityRemaining : item.quantityPurchased) + dist.quantityDistributed;
      await item.save();
    }

    await dist.deleteOne();

    await AuditLog.create({
      item: dist.item,
      performedBy: req.user._id,
      actionType: 'UPDATED',
      notes: `Deleted distribution record for ${dist.quantityDistributed} units (returned to stock)`
    });

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

    // Restore cached remaining stock in the Item document
    const item = await Item.findById(dist.item);
    if (item) {
      item.quantityRemaining = (item.quantityRemaining !== undefined ? item.quantityRemaining : item.quantityPurchased) + returnQty;
      await item.save();
    }

    dist.quantityDistributed -= returnQty;
    dist.remarks = `${dist.remarks ? dist.remarks + ' | ' : ''}Returned ${returnQty} units on ${new Date().toLocaleDateString('en-IN')}`;

    await AuditLog.create({
      item: dist.item,
      performedBy: req.user._id,
      actionType: 'RETURNED',
      notes: `Returned ${returnQty} units to stock from ${dist.distributedToDepartment}`
    });

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
