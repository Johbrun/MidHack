const express = require('express');
const { FLAGS } = require('../flags');

const router = express.Router();

// GET /api/config
// VULNERABLE: Sensitive Data Exposure - leaks secrets and credentials
router.get('/', (req, res) => {
  res.json({
    appName: 'BananaShop',
    version: '1.0.0',
    environment: 'production',
    database: 'sqlite3',
    databasePassword: '1q4sef561s56v4r8vf4',
    adminCredentials: {
      username: 'admin',
    },
    flag: FLAGS.DATA_EXPOSURE,
  });
});

module.exports = router;
