const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const PORT = process.env.PORT || 5000;

app.use(express.json());

// In-memory state
const teams = new Map(); // teamName -> { name, captures: [{ flag, flagName, capturedAt }] }

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Register a team
app.post('/api/teams/register', (req, res) => {
  const { teamName } = req.body;
  if (!teamName) return res.status(400).json({ error: 'teamName required' });

  if (!teams.has(teamName)) {
    teams.set(teamName, { name: teamName, captures: [] });
    broadcast({ type: 'team_registered', teamName });
    broadcastScoreboard();
    console.log(`Team registered: ${teamName}`);
  }

  res.json({ ok: true, teamName });
});

// Record a capture
app.post('/api/capture', (req, res) => {
  const { teamName, flag, flagName, points } = req.body;
  if (!teamName || !flag) return res.status(400).json({ error: 'teamName and flag required' });

  if (!teams.has(teamName)) {
    teams.set(teamName, { name: teamName, captures: [] });
  }

  const team = teams.get(teamName);

  // Prevent duplicates
  if (team.captures.some(c => c.flag === flag)) {
    return res.json({ ok: true, duplicate: true });
  }

  const capture = { flag, flagName: flagName || 'Unknown', points: points || 0, capturedAt: new Date().toISOString() };
  team.captures.push(capture);

  console.log(`CAPTURE: ${teamName} found ${flagName} (${flag}) +${points || 0}pts`);

  broadcast({ type: 'capture', teamName, ...capture });
  broadcastScoreboard();

  res.json({ ok: true });
});

// Get scoreboard
app.get('/api/scoreboard', (req, res) => {
  res.json({ teams: getScoreboardData() });
});

// Serve dashboard page
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  return team.captures.reduce((sum, c) => sum + (c.points || 0), 0);
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
