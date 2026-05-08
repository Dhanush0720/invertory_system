const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeText } = require('../utils/validation');
const { askNirvahana } = require('../utils/agentService');

// GET all active alerts
router.get('/', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'active' }).sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch AI alerts' });
  }
});

// POST resolve an alert
router.post('/:id/resolve', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    await Alert.findByIdAndUpdate(id, { status: 'resolved' });
    res.status(200).json({ message: 'Action executed and alert resolved.' });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// POST natural-language question to Nirvahana (Ollama → Gemini fallback)
router.post('/ask', protect, async (req, res) => {
  try {
    const question = sanitizeText(req.body.question, { allowEmpty: false, max: 400 });
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const Item = require('../models/Item');
    const allItems = await Item.find({}, 'itemName segment quantityPurchased totalCost').lean();
    const snapshot = allItems.slice(0, 150);

    const { answer, source } = await askNirvahana(question, snapshot);
    return res.json({ answer, source });
  } catch (e) {
    console.error('Ask Nirvahana Error:', e);
    res.status(500).json({ error: e.message || 'Nirvahana is temporarily unavailable.' });
  }
});

module.exports = router;
