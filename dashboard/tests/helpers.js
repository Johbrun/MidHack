// Harnais des tests du dashboard.
//
// Chaque test démarre un vrai serveur dashboard sur un dossier de données
// jetable (DASHBOARD_DATA_DIR) et sans contrôle de jeton d'équipe (comme en
// dev local), pour que les assertions portent uniquement sur le barème.
const { spawn } = require('node:child_process');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const { DIFFICULTY_POINTS, CHALLENGES } = require('../../shared/flags.json');

// Port libre attribué par l'OS : deux fichiers de test tournent dans des
// process séparés, une plage aléatoire partagée finissait par entrer en
// collision (deux dashboards sur le même port). Un port éphémère l'évite.
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// Valeurs fixées côté test pour des assertions déterministes.
const HINT_PENALTY = 3;
const FIRST_BLOOD_BONUS = 5;

// Points de base d'un challenge, dérivés du catalogue (jamais recopiés).
const basePoints = (flagId) =>
  DIFFICULTY_POINTS[CHALLENGES.find((c) => c.flagId === flagId).difficulty];

async function startDashboard() {
  const port = await getFreePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dash-test-'));

  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      DASHBOARD_DATA_DIR: dataDir,
      TEAM_TOKENS: '', // contrôle de jeton désactivé
      HINT_PENALTY: String(HINT_PENALTY),
      ADMIN_PASSWORD: 'test-admin',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  const base = `http://127.0.0.1:${port}`;
  await waitForReady(base);

  return {
    base,
    port,
    async stop() {
      child.kill();
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

async function waitForReady(base, attempts = 100) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${base}/api/scoreboard`);
      if (res.ok) return;
    } catch { /* pas encore démarré */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Dashboard injoignable sur ${base}`);
}

async function withDashboard(fn) {
  const dash = await startDashboard();
  try {
    await fn(dash.base, dash);
  } finally {
    await dash.stop();
  }
}

async function api(base, method, pathname, body, headers = {}) {
  const res = await fetch(`${base}${pathname}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, contentType: res.headers.get('content-type') };
}

// Raccourcis lisibles pour les tests.
const capture = (base, teamName, flagId, extra = {}) =>
  api(base, 'POST', '/api/capture', { teamName, flag: `ASY{${flagId}}`, flagId, ...extra });
const hint = (base, teamName, challengeName) =>
  api(base, 'POST', '/api/hint', { teamName, challengeName });
const scoreboard = async (base) => (await api(base, 'GET', '/api/scoreboard')).data.teams;
const scoreOf = (teams, name) => teams.find((t) => t.name === name)?.score;
const rankOf = (teams, name) => teams.findIndex((t) => t.name === name);

// Mot de passe admin fixé côté harnais (cf. startDashboard).
const ADMIN_PASSWORD = 'test-admin';

// Requête admin : porte le jeton attendu par requireAdmin. `token` peut être
// surchargé pour tester le rejet.
const admin = (base, method, pathname, body, token = ADMIN_PASSWORD) =>
  api(base, method, pathname, body, { 'X-Admin-Token': token });

// Connexion WebSocket au dashboard qui collecte les messages reçus.
// `waitFor(type, timeout)` résout dès qu'un message du type demandé arrive.
function connectWs(base) {
  const WebSocket = require('ws');
  const ws = new WebSocket(base.replace(/^http/, 'ws') + '/ws');
  const messages = [];
  const waiters = [];
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    messages.push(msg);
    for (const w of waiters.slice()) {
      if (w.type === msg.type) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg); }
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  return {
    ready,
    messages,
    waitFor(type, timeout = 2000) {
      const existing = messages.find((m) => m.type === type);
      if (existing) return Promise.resolve(existing);
      return new Promise((resolve, reject) => {
        const w = { type, resolve };
        waiters.push(w);
        setTimeout(() => {
          const idx = waiters.indexOf(w);
          if (idx >= 0) { waiters.splice(idx, 1); reject(new Error(`WS: aucun message « ${type} » en ${timeout}ms`)); }
        }, timeout);
      });
    },
    close() { ws.close(); },
  };
}

module.exports = {
  withDashboard,
  api,
  admin,
  connectWs,
  capture,
  hint,
  scoreboard,
  scoreOf,
  rankOf,
  basePoints,
  ADMIN_PASSWORD,
  HINT_PENALTY,
  FIRST_BLOOD_BONUS,
};
