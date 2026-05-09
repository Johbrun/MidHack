const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const { registerTeam } = require('../../shared/register-team');
const { FLAGS } = require('./flags');

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
app.use(cookieParser());

// Initialize database (triggers seed)
require('./db');

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/products', require('./routes/products'));
app.use('/api/products', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/config', require('./routes/config'));
app.use('/api/flags', require('./routes/flags'));
app.use('/api/xss-flag', require('./routes/xss-flag'));

// VULNERABLE: Internal-only endpoint - not linked from the UI, but accessible via SSRF
app.get('/api/internal/flag', (req, res) => {
  res.json({ flag: FLAGS.SSRF, message: 'You accessed an internal endpoint via SSRF!' });
});

// SSE endpoint for admin announcements
const sseClients = [];
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
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
  registerTeam({ dashboardUrl: DASHBOARD_URL, teamName: TEAM_NAME }).catch(() => { });
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
});
