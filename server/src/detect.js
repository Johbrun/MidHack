// Détection d'intention — classe 🟡 des trois classes de réponse.
//
// Règle absolue : ce module ne délivre JAMAIS de flag. Il ne produit que des
// messages d'orientation et des événements de journal. Les flags restent la
// prérogative d'award.js, sur effet réel uniquement.
//
// Le projet a déjà payé cette leçon : la détection SQLi était autrefois
// `username.includes('--')`, ce qui donnait le flag à quiconque tapait deux
// tirets dans un champ, sans la moindre injection. Une heuristique qui se trompe
// sur un message coûte un malentendu ; sur un flag, elle offre un challenge.
const { logEvent } = require('./award');

// Coupe-circuit pour un public avancé : DETECTION_MESSAGES=off.
const ENABLED = (process.env.DETECTION_MESSAGES || 'on').toLowerCase() !== 'off';
// Un message par minute et par compte : sinon un scanner les collectionne et
// cartographie l'application gratuitement.
const COOLDOWN_MS = 60 * 1000;
const lastMessageAt = new Map();

// Chaque signature déclare les endpoints où la technique est effectivement
// exploitable. Un match AILLEURS est un « bonne technique, mauvais endroit ».
const SIGNATURES = [
  {
    id: 'xss',
    re: /<\s*(script|img|svg|iframe|body)\b|\bon\w+\s*=|javascript\s*:/i,
    targets: [
      { method: 'POST', path: /^\/api\/products\/\d+\/reviews$/ },
      { method: 'GET', path: /^\/api\/products\/?$/ },
    ],
    message:
      "Ta payload contient bien du code exécutable, mais cette valeur n'est jamais rendue en HTML : cherche un endroit où le contenu que tu envoies est réaffiché dans la page.",
  },
  {
    id: 'sqli',
    re: /('|%27)\s*(or|and|union)\b|\bunion\b[\s\S]*\bselect\b|(--|#)\s*$|'\s*(or|and)\s*'?\d/i,
    targets: [
      { method: 'POST', path: /^\/api\/auth\/login$/ },
      { method: 'GET', path: /^\/api\/products\/?$/ },
    ],
    message:
      'Ton injection atteint bien le serveur, mais cette requête est paramétrée : ta saisie ne peut pas modifier le SQL ici. Un autre formulaire concatène directement.',
  },
  {
    id: 'traversal',
    re: /\.\.[\/\\]|%2e%2e|\.\.%2f/i,
    targets: [{ method: 'GET', path: /^\/api\/products\/image\/?$/ }],
    message:
      "Ce paramètre ne sert pas à construire un chemin de fichier : cherche un endpoint qui lit un fichier sur le disque.",
  },
];

function scannedText(req) {
  const parts = [req.originalUrl || req.url];
  if (req.body && typeof req.body === 'object') parts.push(JSON.stringify(req.body));
  else if (typeof req.body === 'string') parts.push(req.body);
  return parts.join(' ');
}

function isTarget(signature, req) {
  return signature.targets.some(
    (t) => t.method === req.method && t.path.test(req.path)
  );
}

function cooledDown(key) {
  const last = lastMessageAt.get(key) || 0;
  if (Date.now() - last < COOLDOWN_MS) return false;
  lastMessageAt.set(key, Date.now());
  return true;
}

// Middleware : ajoute un `nudge` à la réponse JSON quand une technique connue
// est employée hors de l'endpoint où elle s'applique.
function detectIntent(req, res, next) {
  if (!ENABLED) return next();

  const text = scannedText(req);
  const matched = SIGNATURES.find((s) => s.re.test(text) && !isTarget(s, req));
  if (!matched) return next();

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    // Un flag vient d'être délivré : la requête est un succès, pas un tâtonnement.
    if (payload && typeof payload === 'object' && !req._awardedFlagId) {
      const key = req.user?.id ? `u${req.user.id}` : `ip${req.ip}`;
      if (cooledDown(key)) {
        payload.nudge = matched.message;
        logEvent(req, {
          flagId: null,
          kind: 'near_miss',
          proof: matched.id,
          detail: { path: req.path },
        });
      }
    }
    return originalJson(payload);
  };

  next();
}

module.exports = { detectIntent };
