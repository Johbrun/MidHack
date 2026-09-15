const crypto = require('crypto');

// Secret du challenge « Vol de cookie ».
//
// Ce n'est PAS le flag : c'est un jeton opaque, régénéré à chaque démarrage et
// connu du seul serveur. Mettre le flag directement dans le cookie le rendrait
// lisible dans les devtools, sans la moindre exfiltration — l'auto-pwn que ce
// challenge doit justement empêcher. Le flag n'est délivré qu'après validation
// de ce jeton par le serveur (POST /api/xss-flag/cookie).
const COOKIE_SECRET = crypto.randomBytes(18).toString('base64url');

// Volontairement accessible à document.cookie : c'est la vulnérabilité enseignée.
const SECRET_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function setSecretCookie(res) {
  res.cookie('ctf_secret', COOKIE_SECRET, SECRET_COOKIE_OPTIONS);
}

function isSecret(value) {
  return typeof value === 'string' && value.trim() === COOKIE_SECRET;
}

module.exports = { setSecretCookie, isSecret };
