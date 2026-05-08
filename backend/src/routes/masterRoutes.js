const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Department = require('../models/Department');
const Particular = require('../models/Particular');
const Item = require('../models/Item');

// Maps collection type to corresponding mongoose model
const getModel = (type) => {
    switch (type) {
        case 'vendors': return Vendor;
        case 'departments': return Department;
        case 'particulars': return Particular;
        default: return null;
    }
};

// GET all items of a specific master type
router.get('/:type', async (req, res) => {
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ message: "Invalid type" });
    try {
        const data = await Model.find().sort('name');
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new item to a specific master type
router.post('/:type', async (req, res) => {
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ message: "Invalid type" });
    try {
        const { name, budget } = req.body;
        const data = { name };
        if (req.params.type === 'departments' && budget !== undefined) data.budget = budget;
        
        const newItem = new Model(data);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Name already exists" });
        res.status(500).json({ error: err.message });
    }
});

// PUT (update) an item
router.put('/:type/:id', async (req, res) => {
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ message: "Invalid type" });
    try {
        const { name, budget } = req.body;
        const updateData = { name };
        if (req.params.type === 'departments' && budget !== undefined) updateData.budget = budget;

        const updated = await Model.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ message: "Not found" });
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Name already exists" });
        res.status(500).json({ error: err.message });
    }
});

// DELETE an item
router.delete('/:type/:id', async (req, res) => {
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ message: "Invalid type" });
    try {
        await Model.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── AUTOCOMPLETE SUGGESTIONS ENDPOINT ──
// Pulls unique item names directly from the inventory list
router.get('/data/suggestions', async (req, res) => {
    try {
        const itemNames = await Item.distinct('itemName');
        res.json({ itemNames });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
