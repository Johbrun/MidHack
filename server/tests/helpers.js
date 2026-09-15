// Harnais des tests de challenges.
//
// Chaque test démarre un vrai serveur sur une base neuve, avec un dashboard
// simulé dont on contrôle les captures : c'est ce qui permet de vérifier les
// prérequis du fil rouge sans dépendre d'une infrastructure.
const { spawn } = require('node:child_process');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

let nextPort = 4300 + Math.floor(Math.random() * 400);
const takePort = () => nextPort++;

// Dashboard simulé : renvoie les captures qu'on lui donne, accepte le reste.
function startStubDashboard(capturedFlagIds = []) {
  const port = takePort();
  const captures = capturedFlagIds.map((flagId) => ({
    flagId,
    capturedAt: new Date().toISOString(),
  }));

  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url.startsWith('/api/scoreboard')) {
      return res.end(JSON.stringify({ teams: [{ name: 'TestTeam', captures, hints: [] }] }));
    }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => res.end(JSON.stringify({ ok: true })));
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve({ url: `http://127.0.0.1:${port}`, server }));
  });
}

// Serveur BananaShop sur une base jetable.
async function startServer({ captured = [] } = {}) {
  const dashboard = await startStubDashboard(captured);
  const port = takePort();
  const dbPath = path.join(os.tmpdir(), `banana-test-${port}-${Date.now()}.db`);

  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: dbPath,
      DASHBOARD_URL: dashboard.url,
      TEAM_NAME: 'TestTeam',
      // Les messages d'orientation ont leur propre test : ils sont désactivés
      // ailleurs pour que les assertions portent sur les flags.
      DETECTION_MESSAGES: process.env.DETECTION_MESSAGES || 'off',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const base = `http://127.0.0.1:${port}`;
  await waitForReady(base);

  return {
    base,
    async stop() {
      child.kill();
      dashboard.server.close();
      for (const suffix of ['', '-shm', '-wal']) {
        fs.rmSync(dbPath + suffix, { force: true });
      }
    },
  };
}

async function waitForReady(base, attempts = 100) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${base}/api/products`);
      if (res.ok) return;
    } catch { /* pas encore démarré */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Serveur injoignable sur ${base}`);
}

// Client HTTP minimal avec mémorisation des cookies (session + ctf_secret).
function client(base) {
  const cookies = new Map();

  function cookieHeader() {
    return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async function request(method, pathname, { body, headers = {} } = {}) {
    const res = await fetch(`${base}${pathname}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookies.size ? { Cookie: cookieHeader() } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    for (const raw of res.headers.getSetCookie?.() || []) {
      const [pair] = raw.split(';');
      const idx = pair.indexOf('=');
      cookies.set(pair.slice(0, idx), pair.slice(idx + 1));
    }

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data };
  }

  return {
    get: (p, opts) => request('GET', p, opts),
    post: (p, body, opts) => request('POST', p, { body, ...opts }),
    put: (p, body, opts) => request('PUT', p, { body, ...opts }),
    cookie: (name) => cookies.get(name),
    setCookie: (name, value) => cookies.set(name, value),
  };
}

// Première adresse IPv4 non-loopback de la machine : sert à vérifier qu'un
// endpoint « interne » refuse bien un appel venu de l'extérieur.
function externalAddress() {
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs || []) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return null;
}

module.exports = { startServer, client, externalAddress };
