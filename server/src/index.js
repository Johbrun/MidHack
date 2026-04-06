const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

app.listen(PORT, () => {
  console.log(`BananaShop server running on port ${PORT}`);
  console.log(`Team: ${TEAM_NAME}`);
});
