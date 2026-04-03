const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5000';
const TEAM_NAME = process.env.TEAM_NAME || 'Team Dev';

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
app.use('/api/debug', require('./routes/debug'));
app.use('/api/flags', require('./routes/flags'));
app.use('/api', require('./routes/flags'));

// Serve static client build in production only
const clientBuild = path.join(__dirname, '..', '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(path.join(clientBuild, 'index.html'))) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Register team with dashboard on startup
setTimeout(() => {
  fetch(`${DASHBOARD_URL}/api/teams/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName: TEAM_NAME }),
  }).catch(() => {});
}, 2000);

app.listen(PORT, () => {
  console.log(`BananaShop server running on port ${PORT}`);
  console.log(`Team: ${TEAM_NAME}`);
});
