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

  // Check for first blood: is this the first team to capture this flag?
  const FIRST_BLOOD_BONUS = 5;
  let firstBlood = true;
  for (const [name, t] of teams) {
    if (name !== teamName && t.captures.some(c => c.flag === flag)) {
      firstBlood = false;
      break;
    }
  }

  const basePoints = points || 0;
  const totalPoints = firstBlood ? basePoints + FIRST_BLOOD_BONUS : basePoints;
  const capture = { flag, flagId: flagId || null, points: totalPoints, firstBlood, capturedAt: new Date().toISOString() };
  team.captures.push(capture);

  saveState();

  if (firstBlood) {
    console.log(`FIRST BLOOD: ${teamName} found ${flagName} (${flag}) +${basePoints}pts +${FIRST_BLOOD_BONUS}pts bonus`);
    broadcast({ type: 'first_blood', teamName, flagId, flagName, points: totalPoints, bonus: FIRST_BLOOD_BONUS });
  } else {
    console.log(`CAPTURE: ${teamName} found ${flagName} (${flag}) +${basePoints}pts`);
  }

  broadcast({ type: 'capture', teamName, ...capture });
  broadcastScoreboard();

  res.json({ ok: true, firstBlood });
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
app.post('/api/reset', requireAdmin, (req, res) => {
  teams.clear();
  saveState();
  console.log('RESET: All scores and hints cleared');
  broadcast({ type: 'reset' });
  broadcastScoreboard();
  res.json({ ok: true });
});

// ─── Freeze mode ───
let frozen = false;

app.post('/api/scoreboard/freeze', requireAdmin, (req, res) => {
  frozen = true;
  console.log('FREEZE: Scoreboard frozen');
  broadcast({ type: 'freeze', frozen: true });
  res.json({ ok: true, frozen });
});

app.post('/api/scoreboard/unfreeze', requireAdmin, (req, res) => {
  frozen = false;
  console.log('UNFREEZE: Scoreboard unfrozen');
  broadcast({ type: 'freeze', frozen: false });
  broadcastScoreboard();
  res.json({ ok: true, frozen });
});

// ─── Announcements ───
app.post('/api/announce', requireAdmin, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  console.log(`ANNOUNCE: ${message}`);
  broadcast({ type: 'announcement', message, timestamp: new Date().toISOString() });
  res.json({ ok: true });
});

// ─── Admin info ───
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
  res.json({ ok: true, token: ADMIN_PASSWORD });
});

app.get('/api/admin/status', requireAdmin, (req, res) => {
  res.json({
    teams: Array.from(teams.keys()),
    teamCount: teams.size,
    frozen,
    timer,
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

// ─── Certificates ───
app.get('/api/certificates', requireAdmin, (req, res) => {
  const scoreboard = getScoreboardData();
  const flagsData = require(path.join(__dirname, '..', '..', 'shared', 'flags.json'));
  const challenges = flagsData.CHALLENGES || [];

  const cards = scoreboard.map((team, i) => {
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const solvedList = team.captures.map(c => {
      const ch = challenges.find(f => f.flagId === c.flagId);
      return ch ? ch.name : c.flagId;
    }).join(', ');

    return `
    <div class="cert">
      <div class="medal">${medal}</div>
      <h2>Certificat de participation</h2>
      <h1>${team.name}</h1>
      <div class="event">${EVENT_TITLE}</div>
      <div class="score">${team.score} points</div>
      <div class="details">
        <p>${team.captures.length} / ${challenges.length} challenges résolus</p>
        ${solvedList ? `<p class="solved">${solvedList}</p>` : ''}
      </div>
      <div class="date">${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>`;
  }).join('\n');

  res.type('html').send(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Certificats - ${EVENT_TITLE}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #f3f4f6; padding: 20px; }
  .cert {
    background: white; border: 3px solid #1a1a2e; border-radius: 16px;
    padding: 48px; margin: 20px auto; max-width: 700px; text-align: center;
    page-break-after: always; position: relative; overflow: hidden;
  }
  .cert::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px;
    background: linear-gradient(135deg, #FABB5C, #0593A7);
  }
  .medal { font-size: 3rem; margin-bottom: 12px; }
  h2 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 3px; color: #9ca3af; margin-bottom: 16px; }
  h1 { font-size: 2.5rem; color: #1a1a2e; margin-bottom: 8px; }
  .event { font-size: 1.1rem; color: #0593A7; font-weight: 600; margin-bottom: 20px; }
  .score { font-size: 2rem; font-weight: 800; color: #FABB5C; margin-bottom: 16px; }
  .details { color: #4b5563; margin-bottom: 20px; }
  .solved { font-size: 0.85rem; color: #9ca3af; margin-top: 8px; }
  .date { font-size: 0.85rem; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px; }
  @media print { body { background: white; padding: 0; } .cert { border: 2px solid #ccc; margin: 0; } }
</style></head><body>${cards}</body></html>`);
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
  ws.send(JSON.stringify({ type: 'scoreboard', teams: getScoreboardData(), config: { hintPenalty: HINT_PENALTY, eventTitle: EVENT_TITLE } }));
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
