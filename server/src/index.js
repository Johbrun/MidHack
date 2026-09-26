const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const { registerTeam } = require('../../shared/register-team');
const { createSseHub, relayDashboardEvents } = require('../../shared/live-events');
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

// SSE : annonces de l'animateur et gel du CTF, relayés depuis le dashboard.
// Quand le CTF est gelé, le front du BananaShop se verrouille.
const events = createSseHub();
app.get('/events', events.handler);

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

app.listen(PORT, () => {
  console.log(`BananaShop server running on port ${PORT}`);
  console.log(`Team: ${TEAM_NAME}`);
  relayDashboardEvents({ WebSocket, dashboardUrl: DASHBOARD_URL, hub: events });
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
