const express = require('express');
const { FLAGS } = require('../flags');

const router = express.Router();

// GET /api/config
// VULNERABLE: Sensitive Data Exposure — leaks secrets and credentials
router.get('/config', (req, res) => {
  res.json({
    appName: 'BananaShop',
    version: '1.0.0',
    environment: 'development',
    database: 'sqlite3',
    jwtSecret: 'secret-pass-to-change',
    adminCredentials: {
      username: 'admin',
      password: 'SuperSecretAdmin123!',
    },
    flag: FLAGS.DATA_EXPOSURE,
  });
});

module.exports = router;
