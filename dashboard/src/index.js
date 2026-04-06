const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');
const { CHALLENGES, CATEGORIES } = require('../../shared/flags');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const PORT = process.env.PORT || 5000;

app.use(express.json());

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
  const { teamName } = req.body;
  if (!teamName) return res.status(400).json({ error: 'teamName required' });

  if (!teams.has(teamName)) {
    teams.set(teamName, { name: teamName, captures: [], hints: [] });
    saveState();
    broadcast({ type: 'team_registered', teamName });
    broadcastScoreboard();
    console.log(`Team registered: ${teamName}`);
  }

  res.json({ ok: true, teamName });
});

// Record a capture
app.post('/api/capture', (req, res) => {
  const { teamName, flag, flagId, flagName, points } = req.body;
  if (!teamName || !flag) return res.status(400).json({ error: 'teamName and flag required' });

  if (!teams.has(teamName)) {
    teams.set(teamName, { name: teamName, captures: [], hints: [] });
  }

  const team = teams.get(teamName);

  // Prevent duplicates
  if (team.captures.some(c => c.flag === flag)) {
    return res.json({ ok: true, duplicate: true });
  }

  const capture = { flag, flagId: flagId || null, points: points || 0, capturedAt: new Date().toISOString() };
  team.captures.push(capture);

  saveState();
  console.log(`CAPTURE: ${teamName} found ${flagName} (${flag}) +${points || 0}pts`);

  broadcast({ type: 'capture', teamName, ...capture });
  broadcastScoreboard();

  res.json({ ok: true });
});

// Record a hint usage
app.post('/api/hint', (req, res) => {
  const { teamName, challengeName } = req.body;
  if (!teamName || !challengeName) return res.status(400).json({ error: 'teamName and challengeName required' });

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
  console.log(`HINT: ${teamName} used hint for ${challengeName} (-3pts)`);

  broadcast({ type: 'hint', teamName, challengeName });
  broadcastScoreboard();

  res.json({ ok: true });
});

// ─── Timer ───
let timer = { endTime: null, duration: null, running: false };

// POST /api/timer/start - start or restart a countdown
app.post('/api/timer/start', (req, res) => {
  const { duration } = req.body; // duration in minutes
  if (!duration || duration <= 0) return res.status(400).json({ error: 'duration (minutes) required' });
  timer = { endTime: Date.now() + duration * 60 * 1000, duration, running: true };
  broadcast({ type: 'timer', ...timer });
  console.log(`Timer started: ${duration} minutes`);
  res.json({ ok: true, ...timer });
});

// POST /api/timer/stop - stop the timer
app.post('/api/timer/stop', (req, res) => {
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
app.post('/api/reset', (req, res) => {
  teams.clear();
  saveState();
  console.log('RESET: All scores and hints cleared');
  broadcast({ type: 'reset' });
  broadcastScoreboard();
  res.json({ ok: true });
});

// Get scoreboard
app.get('/api/scoreboard', (req, res) => {
  res.json({ teams: getScoreboardData() });
});

// Serve dashboard page with injected flag definitions
const INDEX_HTML = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
function renderIndex() {
  return INDEX_HTML
    .replace('/*__CATEGORIES__*/{}', JSON.stringify(CATEGORIES))
    .replace('/*__FLAGS__*/[]', JSON.stringify(CHALLENGES));
}
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.get('/', (req, res) => {
  res.type('html').send(renderIndex());
});

// WebSocket
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'scoreboard', teams: getScoreboardData() }));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

function broadcastScoreboard() {
  broadcast({ type: 'scoreboard', teams: getScoreboardData() });
}

function getTeamScore(team) {
  const capturePoints = team.captures.reduce((sum, c) => sum + (c.points || 0), 0);
  const hintPenalty = (team.hints || []).length * 3;
  return capturePoints - hintPenalty;
}

function getScoreboardData() {
  return Array.from(teams.values())
    .map(t => ({ ...t, score: getTeamScore(t) }))
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
