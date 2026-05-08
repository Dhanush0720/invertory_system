const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Department = require('../models/Department');
const Particular = require('../models/Particular');
const Item = require('../models/Item');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeMasterPayload } = require('../utils/validation');

const getModel = (type) => {
  switch (type) {
    case 'vendors': return Vendor;
    case 'departments': return Department;
    case 'particulars': return Particular;
    default: return null;
  }
};

router.get('/data/suggestions', protect, async (req, res) => {
  try {
    const itemNames = await Item.distinct('itemName');
    res.json({ itemNames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:type', protect, async (req, res) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.status(400).json({ message: 'Invalid type' });

  try {
    const data = await Model.find().sort('name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:type', protect, authorize('admin'), async (req, res) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.status(400).json({ message: 'Invalid type' });

  try {
    const { payload, error } = sanitizeMasterPayload(req.params.type, req.body);
    if (error) return res.status(400).json({ message: error });

    const newItem = new Model(payload);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Name already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:type/:id', protect, authorize('admin'), async (req, res) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.status(400).json({ message: 'Invalid type' });

  try {
    const { payload, error } = sanitizeMasterPayload(req.params.type, req.body);
    if (error) return res.status(400).json({ message: error });

    const updated = await Model.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Name already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:type/:id', protect, authorize('admin'), async (req, res) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.status(400).json({ message: 'Invalid type' });

  try {
    await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
