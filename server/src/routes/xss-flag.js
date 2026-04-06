const express = require('express');
const { FLAGS } = require('../flags');

const router = express.Router();

// Hidden XSS flag endpoint — returns the reflected or stored XSS flag.
// Mounted at /api/xss-flag in index.js.
router.get('/', (req, res) => {
  if (req.query.type === 'reflected') {
    res.json({ flag: FLAGS.REFLECTED_XSS });
  } else {
    res.json({ flag: FLAGS.STORED_XSS });
  }
});

module.exports = router;
