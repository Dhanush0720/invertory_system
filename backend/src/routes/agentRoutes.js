const express = require('express');
const router = express.Router();
const { parseInvoiceVision, generateFinancialForecast } = require('../utils/agentService');
const Distribution = require('../models/Distribution');
const { protect, authorize } = require('../middleware/auth');

const ALLOWED_VISION_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// POST: Vision AI (Upload Receipt)
// Accepts { base64Image: "data:image/jpeg;base64,...", mimeType: "image/jpeg" }
router.post('/vision', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { base64Image, mimeType } = req.body;
        if (!base64Image || typeof base64Image !== 'string' || base64Image.length > 8 * 1024 * 1024) {
            return res.status(400).json({ error: 'A valid image payload is required.' });
        }
        if (!ALLOWED_VISION_MIME_TYPES.has(mimeType)) {
            return res.status(400).json({ error: 'Unsupported image format.' });
        }
        // Strip data header
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const data = await parseInvoiceVision(cleanBase64, mimeType);
        res.status(200).json(data);
    } catch (err) {
        console.error("Vision Route Error:", err);
        res.status(500).json({ error: "Failed to parse receipt text." });
    }
});

// GET: Financial Forecast Agent
router.get('/forecast', protect, async (req, res) => {
    try {
        // Fetch up to 50 recent distributions for calculation
        const recentDistributions = await Distribution.find()
            .populate('item', 'unitPrice totalCost')
            .sort({ dateOfDistribution: -1 })
            .limit(50)
            .lean();

        const condensed = recentDistributions.map(d => ({
            date: d.dateOfDistribution,
            qty: d.quantityDistributed,
            unitPrice: d.item?.unitPrice || 0,
            department: d.distributedToDepartment
        }));

        const forecast = await generateFinancialForecast(condensed);
        res.status(200).json({ forecast });
    } catch (err) {
        console.error("Forecast Route Error:", err);
        res.status(500).json({ error: "Failed to generate forecast." });
    }
});

module.exports = router;
