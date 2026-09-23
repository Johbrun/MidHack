const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const HINT_PENALTY = parseInt(process.env.HINT_PENALTY || '3', 10);
const EVENT_TITLE = process.env.EVENT_TITLE || 'BananaShop CTF';

// Barème et liste des challenges : le dashboard recalcule lui-même les points
// au lieu de faire confiance au champ `points` de la requête.
const { DIFFICULTY_POINTS, CHALLENGES } = require('../../shared/flags.json');
const ENABLED_CHALLENGES = new Map(
  CHALLENGES.filter(c => c.enabled).map(c => [c.flagId, c])
);
const ENABLED_CHALLENGE_NAMES = new Set(
  CHALLENGES.filter(c => c.enabled).map(c => c.name)
);

// Jeton par équipe, injecté dans les conteneurs de l'équipe par setup.sh au
// format "Alpha:jeton1|Bravo:jeton2". Il empêche une équipe de poster des
// captures ou des pénalités d'indice au nom d'une autre. Vide (dev local) =
// contrôle désactivé.
const TEAM_TOKENS = new Map(
  (process.env.TEAM_TOKENS || '')
    .split('|')
    .map(pair => pair.trim())
    .filter(Boolean)
    .map(pair => {
      const idx = pair.lastIndexOf(':');
      return [pair.slice(0, idx), pair.slice(idx + 1)];
    })
);

// Vérifie que l'appelant est bien le service de l'équipe qu'il prétend être.
function teamTokenValid(teamName, req) {
  if (TEAM_TOKENS.size === 0) return true; // dev local : pas de jetons générés
  const expected = TEAM_TOKENS.get(teamName);
  return !!expected && req.headers['x-team-token'] === expected;
}

app.use(express.json());

// Admin auth middleware (simple token via query param or header)
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
  next();
}

// Persistent state
const DATA_FILE = path.join(__dirname, '..', 'data', 'scoreboard.json');
const teams = new Map(); // teamName -> { name, captures: [...], hints: [...] }

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      for (const team of data) {
        teams.set(team.name, team);
      }
      console.log(`Loaded ${teams.size} teams from disk`);
    }
  } catch { /* start fresh */ }
}

function saveState() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(teams.values()), null, 2));
  } catch (err) { console.error('Failed to save state:', err.message); }
}

loadState();

// ─── Feedbacks (participant retros on the event) ───
const FEEDBACK_FILE = path.join(__dirname, '..', 'data', 'feedbacks.json');
let feedbacks = [];
let nextFeedbackId = 1;

function loadFeedbacks() {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
      nextFeedbackId = feedbacks.reduce((m, f) => Math.max(m, f.id || 0), 0) + 1;
      console.log(`Loaded ${feedbacks.length} feedbacks from disk`);
    }
  } catch { feedbacks = []; }
}

function saveFeedbacks() {
  try {
    const dir = path.dirname(FEEDBACK_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2));
  } catch (err) { console.error('Failed to save feedbacks:', err.message); }
}

loadFeedbacks();

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Register a team
app.post('/api/teams/register', (req, res) => {
  const { teamName, service } = req.body;
  if (!teamName) return res.status(400).json({ error: 'teamName required' });

  if (!teamTokenValid(teamName, req)) {
    return res.status(403).json({ error: 'Invalid team token' });
  }

  if (!teams.has(teamName)) {
    teams.set(teamName, { name: teamName, captures: [], hints: [] });
    saveState();
    broadcast({ type: 'team_registered', teamName });
    broadcastScoreboard();
    console.log(`Team registered: ${teamName}`);
  }

  // Chaque démarrage d'un service se signale ici : au-delà du premier, c'est un
  // redémarrage (crash, OOM-kill, déploiement). L'animateur doit le voir sans
  // avoir à ouvrir les logs Docker.
  if (service) {
    const boots = serviceBoots.get(teamName) || {};
    boots[service] = (boots[service] || 0) + 1;
    serviceBoots.set(teamName, boots);
    if (boots[service] > 1) {
      console.warn(`RESTART: ${teamName}/${service} a démarré ${boots[service]} fois`);
      broadcast({ type: 'service_restart', teamName, service, boots: boots[service] });
    }
  }

  res.json({ ok: true, teamName });
});

// Journal des chemins d'exploitation, alimenté par les sites des équipes.
// En mémoire et borné : c'est un outil d'animation pour la session en cours.
const challengeEvents = [];
const MAX_EVENTS = 500;

// Démarrages observés par équipe : { [teamName]: { site: n, exploit: n } }.
// Volontairement en mémoire — c'est un compteur d'incidents pour la session en
// cours, pas une donnée de classement à conserver.
const serviceBoots = new Map();

// Record a capture
const FIRST_BLOOD_BONUS = 5;

// Enregistre une capture. `capturedAt` permet de rejouer, au dégel, les
// captures reçues pendant le gel en conservant leur horodatage d'origine.
function recordCapture({ teamName, flag, flagId, flagName, capturedAt }) {
  if (!teams.has(teamName)) {
    teams.set(teamName, { name: teamName, captures: [], hints: [] });
  }

  const team = teams.get(teamName);

  // Prevent duplicates (par challenge, pas par chaîne de flag)
  if (team.captures.some(c => c.flagId === flagId)) {
    return { duplicate: true };
  }

  // Check for first blood: is this the first team to capture this flag?
  let firstBlood = true;
  for (const [name, t] of teams) {
    if (name !== teamName && t.captures.some(c => c.flagId === flagId)) {
      firstBlood = false;
      break;
    }
  }

  // Les points viennent du barème local, jamais de la requête.
  const basePoints = DIFFICULTY_POINTS[ENABLED_CHALLENGES.get(flagId).difficulty] ?? 0;
  const totalPoints = firstBlood ? basePoints + FIRST_BLOOD_BONUS : basePoints;
  const capture = { flag, flagId, points: totalPoints, firstBlood, capturedAt };
  team.captures.push(capture);

  saveState();

  if (firstBlood) {
    console.log(`FIRST BLOOD: ${teamName} found ${flagName} (${flagId}) +${basePoints}pts +${FIRST_BLOOD_BONUS}pts bonus`);
    broadcast({ type: 'first_blood', teamName, flagId, flagName, points: totalPoints, bonus: FIRST_BLOOD_BONUS });
  } else {
    console.log(`CAPTURE: ${teamName} found ${flagName} (${flagId}) +${basePoints}pts`);
  }

  broadcast({ type: 'capture', teamName, ...capture });
  broadcastScoreboard();

  return { firstBlood };
}

app.post('/api/capture', (req, res) => {
  const { teamName, flag, flagId, flagName } = req.body;
  if (!teamName || !flag) return res.status(400).json({ error: 'teamName and flag required' });

  if (!teamTokenValid(teamName, req)) {
    return res.status(403).json({ error: 'Invalid team token' });
  }

  // Seul un challenge activé peut rapporter des points, et le barème est celui
  // du dashboard : un `points` forgé dans la requête est ignoré.
  if (!flagId || !ENABLED_CHALLENGES.has(flagId)) {
    return res.status(400).json({ error: 'Unknown or disabled challenge' });
  }

  const entry = {
    teamName,
    flag,
    flagId,
    flagName: flagName || ENABLED_CHALLENGES.get(flagId).name,
    capturedAt: new Date().toISOString(),
  };

  // Pendant le gel, la capture est mise en file et rejouée au dégel : elle
  // n'est pas perdue (c'est ce que promet le message renvoyé à l'équipe).
  if (frozen) {
    if (!pendingCaptures.some(c => c.teamName === teamName && c.flagId === flagId)) {
      pendingCaptures.push(entry);
      savePending();
    }
    return res.json({
      ok: true,
      queued: true,
      message: 'Le CTF est gelé. Votre flag est enregistré et sera comptabilisé au dégel.',
    });
  }

  const result = recordCapture(entry);
  res.json({ ok: true, ...result });
});

// Record a hint usage
app.post('/api/hint', (req, res) => {
  const { teamName, challengeName } = req.body;
  if (!teamName || !challengeName) return res.status(400).json({ error: 'teamName and challengeName required' });

  if (!teamTokenValid(teamName, req)) {
    return res.status(403).json({ error: 'Invalid team token' });
  }

  if (!ENABLED_CHALLENGE_NAMES.has(challengeName)) {
    return res.status(400).json({ error: 'Unknown challenge' });
  }

  if (!teams.has(teamName)) {
    teams.set(teamName, { name: teamName, captures: [], hints: [] });
  }

  const team = teams.get(teamName);
  if (!team.hints) team.hints = [];

  // Prevent duplicates
  if (team.hints.some(h => h.challengeName === challengeName)) {
    return res.json({ ok: true, duplicate: true });
  }

  const hint = { challengeName, usedAt: new Date().toISOString() };
  team.hints.push(hint);

  saveState();
  console.log(`HINT: ${teamName} used hint for ${challengeName} (-${HINT_PENALTY}pts)`);

  broadcast({ type: 'hint', teamName, challengeName });
  broadcastScoreboard();

  res.json({ ok: true });
});

// ─── Blue Team: exercice de remédiation par équipe ───
// Chaque équipe a une carte `blue` : { [flagId]: 'ok' | 'first' }. Un correctif
// trouvé du premier coup ('first') l'emporte sur un correctif trouvé après une
// erreur ('ok') et n'est jamais rétrogradé. Le classement n'en dépend pas —
// apprendre à corriger ne rapporte pas de points — mais l'animateur voit en
// direct qui a joué la phase défensive, et combien de correctifs sans erreur.
app.post('/api/blue-progress', (req, res) => {
  const { teamName, flagId, firstTry } = req.body;
  if (!teamName || !flagId) return res.status(400).json({ error: 'teamName and flagId required' });

  if (!teamTokenValid(teamName, req)) {
    return res.status(403).json({ error: 'Invalid team token' });
  }

  if (!ENABLED_CHALLENGES.has(flagId)) {
    return res.status(400).json({ error: 'Unknown or disabled challenge' });
  }

  if (!teams.has(teamName)) {
    teams.set(teamName, { name: teamName, captures: [], hints: [], blue: {} });
  }

  const team = teams.get(teamName);
  if (!team.blue) team.blue = {};

  // Idempotent : rejouer un exercice ne dégrade pas un « premier coup ».
  const current = team.blue[flagId];
  const next = firstTry ? 'first' : 'ok';
  if (current === 'first' || current === next) {
    return res.json({ ok: true, blue: blueStats(team) });
  }
  team.blue[flagId] = next;

  saveState();
  console.log(`BLUE: ${teamName} a corrigé ${flagId} (${next})`);
  broadcastScoreboard();

  res.json({ ok: true, blue: blueStats(team) });
});

// ─── Timer ───
let timer = { endTime: null, duration: null, running: false };

// POST /api/timer/start - start or restart a countdown
app.post('/api/timer/start', requireAdmin, (req, res) => {
  const { duration } = req.body; // duration in minutes
  if (!duration || duration <= 0) return res.status(400).json({ error: 'duration (minutes) required' });
  timer = { endTime: Date.now() + duration * 60 * 1000, duration, running: true };
  broadcast({ type: 'timer', ...timer });
  console.log(`Timer started: ${duration} minutes`);
  res.json({ ok: true, ...timer });
});

// POST /api/timer/stop - stop the timer
app.post('/api/timer/stop', requireAdmin, (req, res) => {
  timer = { endTime: null, duration: null, running: false };
  broadcast({ type: 'timer', ...timer });
  console.log('Timer stopped');
  res.json({ ok: true });
});

// GET /api/timer - get current timer state
app.get('/api/timer', (req, res) => {
  res.json(timer);
});

// Reset all scores and hints
app.post('/api/reset', requireAdmin, (req, res) => {
  teams.clear();
  pendingCaptures = [];
  savePending();
  saveState();
  console.log('RESET: All scores and hints cleared');
  broadcast({ type: 'reset' });
  broadcastScoreboard();
  res.json({ ok: true });
});

// ─── Freeze mode ───
let frozen = false;
// Captures reçues pendant le gel, rejouées telles quelles au dégel. Persistées
// sur disque : un redémarrage du dashboard pendant le gel ne doit pas faire
// perdre les flags déjà soumis par les équipes.
const PENDING_FILE = path.join(__dirname, '..', 'data', 'pending-captures.json');
let pendingCaptures = [];

function loadPending() {
  try {
    if (fs.existsSync(PENDING_FILE)) {
      const data = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
      frozen = !!data.frozen;
      pendingCaptures = data.captures || [];
      if (frozen || pendingCaptures.length) {
        console.log(`Restored freeze state (frozen=${frozen}, ${pendingCaptures.length} pending capture(s))`);
      }
    }
  } catch { pendingCaptures = []; }
}

function savePending() {
  try {
    const dir = path.dirname(PENDING_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PENDING_FILE, JSON.stringify({ frozen, captures: pendingCaptures }, null, 2));
  } catch (err) { console.error('Failed to save pending captures:', err.message); }
}

loadPending();

app.post('/api/scoreboard/freeze', requireAdmin, (req, res) => {
  frozen = true;
  savePending();
  console.log('FREEZE: CTF frozen');
  broadcast({ type: 'freeze', frozen: true });
  res.json({ ok: true, frozen });
});

app.post('/api/scoreboard/unfreeze', requireAdmin, (req, res) => {
  frozen = false;
  const queued = pendingCaptures;
  pendingCaptures = [];
  savePending();
  for (const entry of queued) recordCapture(entry);
  console.log(`UNFREEZE: CTF unfrozen (${queued.length} capture(s) en attente rejouée(s))`);
  broadcast({ type: 'freeze', frozen: false });
  broadcastScoreboard();
  res.json({ ok: true, frozen, replayed: queued.length });
});

// ─── Announcements ───
app.post('/api/announce', requireAdmin, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  console.log(`ANNOUNCE: ${message}`);
  broadcast({ type: 'announcement', message, timestamp: new Date().toISOString() });
  res.json({ ok: true });
});

// ─── Feedbacks ───
// Submit a feedback (sent by a team's Hacking QG, no admin auth required)
app.post('/api/feedback', (req, res) => {
  const { teamName, answers } = req.body;
  if (!Array.isArray(answers) || !answers.some((a) => a && String(a.answer).trim())) {
    return res.status(400).json({ error: 'answers required' });
  }
  const cleanAnswers = answers
    .filter((a) => a && String(a.answer).trim())
    .map((a) => ({
      id: a.id || null,
      question: String(a.question || '').slice(0, 500),
      answer: String(a.answer).trim().slice(0, 4000),
    }));
  const entry = {
    id: nextFeedbackId++,
    teamName: teamName || 'Anonyme',
    answers: cleanAnswers,
    createdAt: new Date().toISOString(),
  };
  feedbacks.unshift(entry);
  saveFeedbacks();
  console.log(`FEEDBACK from ${entry.teamName} (${cleanAnswers.length} réponse(s))`);
  res.json({ ok: true });
});

// List all feedbacks (admin only)
app.get('/api/feedback', requireAdmin, (req, res) => {
  res.json({ feedbacks });
});

// Export all feedbacks as a plain text file (admin only)
app.get('/api/feedback/export', requireAdmin, (req, res) => {
  const sep = '═'.repeat(60);
  const lines = [
    `Feedbacks — ${EVENT_TITLE}`,
    `Exporté le ${new Date().toLocaleString('fr-FR')}`,
    `${feedbacks.length} feedback(s)`,
    '',
  ];
  for (const f of feedbacks) {
    lines.push(sep);
    lines.push(`Équipe : ${f.teamName}`);
    lines.push(`Date   : ${new Date(f.createdAt).toLocaleString('fr-FR')}`);
    lines.push('');
    for (const a of f.answers || []) {
      lines.push(`Q: ${a.question}`);
      lines.push(`R: ${a.answer}`);
      lines.push('');
    }
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="feedbacks.txt"');
  res.send(lines.join('\n'));
});

// ─── Admin info ───
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
  res.json({ ok: true, token: ADMIN_PASSWORD });
});

// Chemin emprunté par une équipe : flag délivré, flag retenu (un autre avait
// déjà été délivré sur la requête), challenge verrouillé, effet de bord, ou
// technique employée au mauvais endroit.
app.post('/api/challenge-event', (req, res) => {
  const { teamName, flagId, kind, proof, username, at } = req.body || {};
  if (!teamName || !kind) return res.status(400).json({ error: 'teamName and kind required' });
  if (!teamTokenValid(teamName, req)) return res.status(403).json({ error: 'Invalid team token' });

  challengeEvents.unshift({ teamName, flagId: flagId || null, kind, proof: proof || null, username: username || null, at: at || new Date().toISOString() });
  if (challengeEvents.length > MAX_EVENTS) challengeEvents.pop();
  res.json({ ok: true });
});

app.get('/api/admin/events', requireAdmin, (req, res) => {
  const { team } = req.query;
  const events = team ? challengeEvents.filter(e => e.teamName === team) : challengeEvents;
  res.json({ events: events.slice(0, 100) });
});

app.get('/api/admin/status', requireAdmin, (req, res) => {
  res.json({
    teams: Array.from(teams.keys()),
    teamCount: teams.size,
    frozen,
    timer,
    pendingCaptures: pendingCaptures.length,
    // Un service à plus d'un démarrage a redémarré pendant l'atelier.
    restarts: Object.fromEntries(
      Array.from(serviceBoots.entries())
        .map(([team, boots]) => [
          team,
          Object.fromEntries(Object.entries(boots).map(([svc, n]) => [svc, n - 1])),
        ])
        .filter(([, boots]) => Object.values(boots).some((n) => n > 0))
    ),
  });
});

// ─── Export ───
app.get('/api/export', requireAdmin, (req, res) => {
  const scoreboard = getScoreboardData();
  const format = req.query.format || 'json';
  if (format === 'csv') {
    const header = 'rank,team,score,captures,hints,first_capture';
    const rows = scoreboard.map((t, i) => {
      const firstCapture = t.captures[0]?.capturedAt || '';
      return `${i + 1},${t.name},${t.score},${t.captures.length},${(t.hints || []).length},${firstCapture}`;
    });
    res.type('text/csv').send([header, ...rows].join('\n'));
  } else {
    res.json({ teams: scoreboard, exportedAt: new Date().toISOString() });
  }
});

// Get scoreboard
app.get('/api/scoreboard', (req, res) => {
  res.json({ teams: getScoreboardData(), config: { hintPenalty: HINT_PENALTY, eventTitle: EVENT_TITLE } });
});

// Serve the built React client from dashboard/client/dist.
// In dev, run `npm run dev` (at dashboard/) to start Vite on :5173 with
// hot reload; Vite proxies /api and /ws to this Express server on :5000.
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res
      .status(503)
      .type('text/plain')
      .send('Client not built. Run `npm run build` in dashboard/client/ or use `npm run dev` for hot reload.');
  });
}

// WebSocket
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'scoreboard', teams: getScoreboardData(), config: { hintPenalty: HINT_PENALTY, eventTitle: EVENT_TITLE }, frozen }));
  if (frozen) ws.send(JSON.stringify({ type: 'freeze', frozen: true }));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

function broadcastScoreboard() {
  if (frozen) return; // When frozen, public clients don't receive updates
  broadcast({ type: 'scoreboard', teams: getScoreboardData() });
}

function getTeamScore(team) {
  const capturePoints = team.captures.reduce((sum, c) => sum + (c.points || 0), 0);
  const hintPenalty = (team.hints || []).length * HINT_PENALTY;
  return capturePoints - hintPenalty;
}

// Stats Blue Team d'une équipe, dérivées de la carte { flagId: 'ok' | 'first' }.
// `answered` = questions répondues (correctif trouvé), `firstTry` = correctifs
// trouvés du premier coup. Sans impact sur le score.
function blueStats(team) {
  const entries = Object.values(team.blue || {});
  return {
    answered: entries.length,
    firstTry: entries.filter(v => v === 'first').length,
  };
}

function getScoreboardData() {
  return Array.from(teams.values())
    .map(t => ({ ...t, blue: blueStats(t), score: getTeamScore(t) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.captures.length !== a.captures.length) return b.captures.length - a.captures.length;
      const aFirst = a.captures[0]?.capturedAt || 'z';
      const bFirst = b.captures[0]?.capturedAt || 'z';
      return aFirst.localeCompare(bFirst);
    });
}

server.listen(PORT, () => {
  console.log(`Dashboard live on port ${PORT}`);
});
