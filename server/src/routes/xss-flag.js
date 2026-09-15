const express = require('express');
const { awardFlag } = require('../award');

const router = express.Router();

// Endpoint caché appelé par une payload XSS exécutée dans le navigateur de la
// victime : c'est cet appel, et non l'injection elle-même, qui prouve
// l'exécution. Monté sur /api/xss-flag dans index.js.
router.get('/', (req, res) => {
  const response = {};
  const reflected = req.query.type === 'reflected';

  awardFlag(req, response, reflected ? 'REFLECTED_XSS' : 'STORED_XSS', {
    proof: 'xss_payload_executed',
    type: reflected ? 'reflected' : 'stored',
    message: 'Payload XSS exécutée dans le navigateur : le script a bien tourné !',
  });

  res.json(response);
});

module.exports = router;
