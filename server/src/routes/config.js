const express = require('express');
const { awardFlag } = require('../award');

const router = express.Router();

// GET /api/config
// VULNERABLE: Sensitive Data Exposure - leaks secrets and credentials
router.get('/', (req, res) => {
  const response = {
    appName: 'BananaShop',
    version: '1.0.0',
    environment: 'production',
    database: 'sqlite3',
    databasePassword: '1q4sef561s56v4r8vf4',
    adminCredentials: {
      username: 'admin',
    },
  };

  awardFlag(req, response, 'DATA_EXPOSURE', {
    proof: 'debug_endpoint_reached',
    message: 'Endpoint de debug atteint : il expose les secrets de configuration.',
  });

  res.json(response);
});

module.exports = router;
