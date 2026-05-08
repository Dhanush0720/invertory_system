const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET: Fetch all active AI alerts for the Dashboard
router.get('/', async (req, res) => {
    try {
        const alerts = await Alert.find({ status: 'active' }).sort({ createdAt: -1 });
        res.status(200).json(alerts);
    } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ error: "Failed to fetch AI alerts" });
    }
});

// POST: Mark an alert as resolved when action is taken
router.post('/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        await Alert.findByIdAndUpdate(id, { status: 'resolved' });
        res.status(200).json({ message: "Action executed and alert resolved." });
    } catch (error) {
        console.error("Error resolving alert:", error);
        res.status(500).json({ error: "Failed to resolve alert" });
    }
});

// POST: "Ask Nirvahana" dynamic query route
router.post('/ask', async (req, res) => {
    try {
        const { question } = req.body;
        const Item = require('../models/Item');
        // Fetch snapshot of inventory data for context (limited to prevent token overflow)
        const allItems = await Item.find({}, 'itemName segment quantityPurchased quantityRemaining totalCost distributedToDepartment').lean();
        
        const systemPrompt = "You are Nirvahana, an advanced autonomous AI managing the college inventory. Answer the user's question clearly, professionally, and concisely based ONLY on the provided JSON inventory data. Do not use markdown blocks, just return plain text. ALWAYS use Indian Rupees (₹) and the Indian numbering system for any monetary values. NEVER use Dollars ($).";
        const prompt = `${systemPrompt}\n\nInventory Data Snapshot:\n${JSON.stringify(allItems.slice(0, 150))}\n\nUser Question: ${question}`;

        console.log(`🧠 Question received: "${question}" - querying Ollama...`);
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2',
                prompt: prompt,
                stream: false
            })
        });

        if (ollamaRes.ok) {
            const data = await ollamaRes.json();
            return res.json({ answer: data.response });
        }
        res.status(500).json({ error: "Ollama is not running locally." });
    } catch (e) {
        console.error("Ask Nirvahana Error:", e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;