const express = require('express');
const { ALL_FLAGS, FLAG_NAMES, FLAGS } = require('../flags');

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

  // Notify the central dashboard
  fetch(`${DASHBOARD_URL}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName: TEAM_NAME, flag, flagName }),
  }).catch(() => {
    // Dashboard might not be running in dev mode
  });

  res.json({
    valid: true,
    flagName,
    message: `Congratulations! You found the ${flagName} flag!`,
  });
});

// Hidden XSS flag endpoint
// GET /api/xss-flag
router.get('/xss-flag', (req, res) => {
  const type = req.query.type;
  const referer = req.headers.referer || '';

  if (type === 'reflected') {
    res.json({ flag: FLAGS.REFLECTED_XSS });
  } else {
    res.json({ flag: FLAGS.STORED_XSS });
  }
});

module.exports = router;
