const express = require('express');
const { ALL_FLAGS, FLAG_NAMES, FLAG_POINTS, FLAG_EXPLANATIONS, FLAG_IDS } = require('../flags');

const router = express.Router();

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5000';
const TEAM_NAME = process.env.TEAM_NAME || 'Unknown Team';

// POST /api/flags/submit
router.post('/submit', (req, res) => {
  const { flag } = req.body;

  if (!flag) {
    return res.status(400).json({ error: 'Flag is required' });
  }

  if (!ALL_FLAGS.includes(flag)) {
    return res.status(400).json({ error: 'Invalid flag', valid: false });
  }

  const flagName = FLAG_NAMES[flag] || 'Unknown';
  const flagId = FLAG_IDS[flag] || 'UNKNOWN';
  const flagInfo = FLAG_POINTS[flag] || { points: 0, difficulty: 'Unknown' };

  // Notify the central dashboard
  fetch(`${DASHBOARD_URL}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName: TEAM_NAME, flag, flagId, flagName, points: flagInfo.points }),
  }).catch(() => {
    // Dashboard might not be running in dev mode
  });

  const explanation = FLAG_EXPLANATIONS[flag] || null;

  res.json({
    valid: true,
    flagId,
    flagName,
    points: flagInfo.points,
    difficulty: flagInfo.difficulty,
    message: `Congratulations! You found the ${flagName} flag! (+${flagInfo.points} pts)`,
    explanation,
  });
});

module.exports = router;
