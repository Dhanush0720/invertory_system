const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Distribution = require('../models/Distribution');
const { protect, authorize } = require('../middleware/auth');

// ── Helper: batch aggregation for all items (replaces N+1 per-item queries)
async function buildDistMap(itemIds) {
  const filter = itemIds ? { item: { $in: itemIds } } : {};
  const result = await Distribution.aggregate([
    { $match: filter },
    { $group: { _id: '$item', total: { $sum: '$quantityDistributed' } } }
  ]);
  const map = {};
  result.forEach(r => { map[r._id.toString()] = r.total; });
  return map;
}

// GET /api/items  (supports ?page=1&limit=50&segment=&search=)
router.get('/', protect, async (req, res) => {
  try {
    const { segment, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    let query = {};
    if (segment) query.segment = segment;
    if (search) query.$or = [
      { itemName: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { shopName: { $regex: search, $options: 'i' } },
      { particulars: { $regex: search, $options: 'i' } },
    ];

    const [items, total] = await Promise.all([
      Item.find(query).populate('addedBy', 'name').sort('-createdAt').skip(skip).limit(limit),
      Item.countDocuments(query)
    ]);

    // Single batch aggregation over fetched page only — O(1) DB calls instead of N
    const itemIds = items.map(i => i._id);
    const distMap = await buildDistMap(itemIds);

    const itemsWithStock = items.map(item => {
      const distributed = distMap[item._id.toString()] || 0;
      const remaining = item.quantityPurchased - distributed;
      return {
        ...item.toObject(),
        quantityDistributed: distributed,
        quantityRemaining: remaining,
        isLowStock: remaining <= 5 && remaining > 0,
        isOutOfStock: remaining <= 0
      };
    });

    res.json({
      items: itemsWithStock,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/items/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('addedBy', 'name');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const distMap = await buildDistMap([item._id]);
    const distributed = distMap[item._id.toString()] || 0;
    res.json({ ...item.toObject(), quantityDistributed: distributed, quantityRemaining: item.quantityPurchased - distributed });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/items
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    if (!req.body.itemName || req.body.quantityPurchased < 0) {
      return res.status(400).json({ message: 'Invalid item parameters' });
    }
    const item = await Item.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/items/:id
router.put('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/items/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await Distribution.deleteMany({ item: req.params.id });
    res.json({ message: 'Item deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/items/bulk-import  — optimized: batch-prepare then insertMany
router.post('/bulk-import', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ message: 'No items provided' });

    const toInsert = [];
    const toInsertDist = []; // distributions to create after item insertMany
    const failed = [];

    // ── Phase 1: Validate + prepare documents (no DB writes yet)
    items.forEach((row, i) => {
      try {
        const itemName = (row.itemName || '').toString().trim();
        const quantityPurchased = parseFloat(row.quantityPurchased) || 0;
        if (!itemName) throw new Error('Item name required');

        let dateOfPurchase = new Date();
        if (row.dateOfPurchase) {
          const raw = row.dateOfPurchase;
          if (typeof raw === 'number') dateOfPurchase = new Date((raw - 25569) * 86400000);
          else { const p = new Date(raw); if (!isNaN(p)) dateOfPurchase = p; }
        }
        const unitPrice = parseFloat(row.unitPrice) || 0;
        const totalCost = row.totalCost ? parseFloat(row.totalCost) : quantityPurchased * unitPrice;

        const doc = {
          segment: (row.segment || row.category || 'OTHER').toString().trim(),
          itemName,
          dateOfPurchase,
          company: (row.company || '').toString().trim() || undefined,
          billNo: (row.billNo || '').toString().trim() || undefined,
          uom: (row.uom || 'Nos').toString().trim(),
          quantityPurchased,
          unitPrice,
          totalCost,
          shopName: (row.shopName || '').toString().trim() || undefined,
          particulars: (row.particulars || '').toString().trim() || undefined,
          addedBy: req.user._id
        };

        const distQty = parseFloat(row.quantityDistributed) || 0;
        toInsert.push({ doc, row: i + 1, distQty, rawRow: row, dateOfPurchase });
      } catch (err) {
        failed.push({ row: i + 1, itemName: (row.itemName || '—'), reason: err.message });
      }
    });

    // ── Phase 2: Batch insert all valid items at once
    const inserted = await Item.insertMany(toInsert.map(t => t.doc), { ordered: false });

    const succeeded = [];
    // ── Phase 3: Batch-build distributions for rows that had distQty
    inserted.forEach((created, idx) => {
      const { distQty, rawRow, dateOfPurchase, row, doc } = toInsert[idx];
      succeeded.push({ row, itemName: created.itemName });
      if (distQty > 0 && distQty <= doc.quantityPurchased) {
        let distDate = dateOfPurchase;
        if (rawRow.dateOfDistribution) {
          const r = rawRow.dateOfDistribution;
          if (typeof r === 'number') distDate = new Date((r - 25569) * 86400000);
          else { const p = new Date(r); if (!isNaN(p)) distDate = p; }
        }
        toInsertDist.push({
          item: created._id,
          quantityDistributed: distQty,
          dateOfDistribution: distDate,
          distributedToDepartment: (rawRow.distributedToDepartment || 'General').toString().trim(),
          authorisedBy: (rawRow.authorisedBy || 'Imported').toString().trim(),
          uom: created.uom,
          distributedBy: req.user._id
        });
      }
    });

    if (toInsertDist.length) await Distribution.insertMany(toInsertDist, { ordered: false });

    res.json({ total: items.length, imported: succeeded.length, failed: failed.length, succeeded, errors: failed });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
