const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const { registerTeam } = require('../../shared/register-team');
const { awardFlag } = require('./award');
const progress = require('./progress');
const { detectIntent } = require('./detect');

const app = express();
const PORT = process.env.PORT || 3000;
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5000';
const TEAM_NAME = process.env.TEAM_NAME || 'Unknown Team';

// VULNERABLE: Intentionally misconfigured security headers
app.use((req, res, next) => {
  // Too permissive CSP - allows inline scripts and eval (doesn't block XSS)
  res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data:; connect-src *");
  // ALLOW is not a valid value - should be DENY or SAMEORIGIN
  res.setHeader('X-Frame-Options', 'ALLOW');
  // Leaks full URL to third parties
  res.setHeader('Referrer-Policy', 'unsafe-url');
  // Missing X-Content-Type-Options (should be 'nosniff')
  next();
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
// Un POST de formulaire HTML arrive en application/x-www-form-urlencoded :
// sans ce parser, le body est vide (et la démo CSRF ne peut pas fonctionner).
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Classe 🟡 : oriente quand une technique connue est employée au mauvais endroit.
// Ne délivre jamais de flag (cf. detect.js).
app.use(detectIntent);

// Initialize database (triggers seed)
require('./db');

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/subscriptions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/products', require('./routes/products'));
app.use('/api/products', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/config', require('./routes/config'));
app.use('/api/flags', require('./routes/flags'));
app.use('/api/xss-flag', require('./routes/xss-flag'));

// L'endpoint interne n'est PLUS servi sur le port applicatif : il vit sur un
// listener loopback dédié (voir plus bas). Toute tentative directe sur le port
// exposé — donc via le navigateur d'un participant — reçoit un 404.
//
// Pourquoi : l'ancien garde-fou basé sur `req.socket.remoteAddress === 127.0.0.1`
// était contournable. Derrière un reverse-proxy local (Vite en dev, nginx en
// prod), l'IP source vue par le backend est TOUJOURS 127.0.0.1, y compris pour
// une requête navigateur relayée par le proxy. Le flag tombait donc sans SSRF.
app.all('/api/internal/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// SSE endpoint for admin announcements
const sseClients = [];
// Mirrors the dashboard scoreboard freeze state (received over the dashboard WS).
// When frozen, the BananaShop front locks access.
let frozen = false;
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Push the current freeze state immediately so a fresh page load locks
  // right away if the scoreboard is already frozen.
  res.write(`data: ${JSON.stringify({ type: 'freeze', frozen })}\n\n`);
  sseClients.push(res);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Serve static client build in production only
const clientBuild = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(path.join(clientBuild, 'index.html'))) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Register team with dashboard on startup
setTimeout(() => {
  registerTeam({ dashboardUrl: DASHBOARD_URL, teamName: TEAM_NAME, service: 'site' }).catch(() => { });
}, 2000);

// Connect to dashboard WebSocket to relay announcements via SSE
function connectDashboardWs() {
  try {
    const wsUrl = DASHBOARD_URL.replace(/^http/, 'ws') + '/ws';
    const ws = new WebSocket(wsUrl);
    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw);
        if (data.type === 'announcement') {
          const payload = `data: ${JSON.stringify({ type: 'announcement', message: data.message })}\n\n`;
          for (const client of sseClients) client.write(payload);
        } else if (data.type === 'freeze') {
          frozen = data.frozen;
          const payload = `data: ${JSON.stringify({ type: 'freeze', frozen })}\n\n`;
          for (const client of sseClients) client.write(payload);
        }
      } catch { /* ignore parse errors */ }
    });
    ws.on('close', () => setTimeout(connectDashboardWs, 5000));
    ws.on('error', () => {});
  } catch {
    setTimeout(connectDashboardWs, 5000);
  }
}

app.listen(PORT, () => {
  console.log(`BananaShop server running on port ${PORT}`);
  console.log(`Team: ${TEAM_NAME}`);
  connectDashboardWs();
  // Instantané des captures de l'équipe : alimente les prérequis des challenges.
  progress.start();
});

// VULNERABLE (SSRF): endpoint interne servi sur un listener HTTP séparé, bindé
// sur la boucle locale et JAMAIS proxifié par Vite ni exposé par Docker.
// Conséquence : le navigateur d'un participant ne peut pas l'atteindre (il ne
// parle qu'au port applicatif proxifié) ; seule une requête émise PAR le serveur
// lui-même peut le joindre, c.-à-d. la SSRF via POST /api/products/:id/image-url
// ciblant http://127.0.0.1:<INTERNAL_PORT>/api/internal/flag.
const INTERNAL_PORT = process.env.INTERNAL_PORT || 9000;
const internalApp = express();
internalApp.get('/api/internal/flag', (req, res) => {
  const response = {};
  awardFlag(req, response, 'SSRF', {
    proof: 'internal_endpoint_via_loopback',
    message: 'Endpoint interne atteint depuis le serveur lui-même : SSRF réussie !',
  });
  res.json(response);
});
internalApp.listen(INTERNAL_PORT, '127.0.0.1', () => {
  console.log(`Internal endpoint on 127.0.0.1:${INTERNAL_PORT} (loopback only)`);
});
