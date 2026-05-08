const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeLocationPayload } = require('../utils/validation');

router.get('/', protect, async (req, res) => {
  try {
    const locations = await Location.find()
      .sort({ building: 1, floor: 1, room: 1 })
      .populate('manager', 'name email');
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { payload, error } = sanitizeLocationPayload(req.body);
    if (error) return res.status(400).json({ message: error });

    const newLocation = new Location(payload);
    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'This room already exists on this floor in this building.' });
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { payload, error } = sanitizeLocationPayload(req.body);
    if (error) return res.status(400).json({ message: error });

    const updated = await Location.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Location not found' });
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'This room already exists on this floor in this building.' });
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hierarchy', protect, async (req, res) => {
  try {
    const locations = await Location.find({}, { building: 1, floor: 1, room: 1 });
    const hierarchy = {};

    locations.forEach((loc) => {
      if (!hierarchy[loc.building]) hierarchy[loc.building] = {};
      if (!hierarchy[loc.building][loc.floor]) hierarchy[loc.building][loc.floor] = [];
      hierarchy[loc.building][loc.floor].push({ id: loc._id, room: loc.room });
    });

    res.json(hierarchy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
