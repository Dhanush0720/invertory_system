const express = require('express');
const router = express.Router();
const { runAutonomousAgent } = require('../jobs/agentJob');

// POST /api/jobs/trigger-agent
router.post('/trigger-agent', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const configuredKey = process.env.JOBS_API_KEY;

  if (!configuredKey) {
    return res.status(500).json({ message: 'Jobs API Key is not configured on the server.' });
  }

  if (apiKey !== configuredKey) {
    return res.status(401).json({ message: 'Unauthorized. Invalid API key.' });
  }

  // Trigger asynchronously so it returns 200 OK immediately
  runAutonomousAgent().catch(err => {
    console.error('Autonomous agent execution failed via webhook:', err);
  });

  res.json({ message: 'Autonomous agent triggered successfully.' });
});

module.exports = router;
