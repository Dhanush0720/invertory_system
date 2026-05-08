const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// GET all locations
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find().sort({ building: 1, floor: 1, room: 1 }).populate('manager', 'name email');
        res.json(locations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new location
router.post('/', async (req, res) => {
    try {
        const newLocation = new Location(req.body);
        await newLocation.save();
        res.status(201).json(newLocation);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "This room already exists on this floor in this building." });
        res.status(400).json({ error: err.message });
    }
});

// PUT update location
router.put('/:id', async (req, res) => {
    try {
        const updated = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Location not found" });
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "This room already exists on this floor in this building." });
        res.status(400).json({ error: err.message });
    }
});

// DELETE location
router.delete('/:id', async (req, res) => {
    try {
        await Location.findByIdAndDelete(req.params.id);
        res.json({ message: "Location deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET hierarchical breakdown for UI dropdowns
router.get('/hierarchy', async (req, res) => {
    try {
        const locations = await Location.find({}, { building: 1, floor: 1, room: 1 });
        const hierarchy = {};

        locations.forEach(loc => {
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
