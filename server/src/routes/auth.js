const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
const { FLAGS } = require('../flags');

const router = express.Router();

// VULNERABLE: httpOnly intentionally disabled so document.cookie exposes the
// JWT — required for the Cookie Theft (XSS) challenge.
const TOKEN_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)'
  ).run(username, hash, email || null);

  const token = jwt.sign(
    { id: result.lastInsertRowid, username, role: 'user', super_admin: false },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.cookie('token', token, TOKEN_COOKIE_OPTIONS);
  res.json({ id: result.lastInsertRowid, username, role: 'user' });
});

// POST /api/auth/login
// VULNERABLE: SQL Injection via string interpolation
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // VULNERABLE: string interpolation instead of parameterized query
    const sqliUser = db.prepare(`SELECT * FROM users WHERE username = '${username}' AND password_hash = '${password}'`).get();

    let authedUser;
    if (sqliUser) {
      authedUser = sqliUser;
    } else {
      // Fallback: legitimate login path with bcrypt check
      const legitUser = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
      if (!legitUser || !bcrypt.compareSync(password, legitUser.password_hash)) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }
      authedUser = legitUser;
    }

    const isSqli = username.includes("--") || password.includes("--");

    const isAdmin = authedUser.role === 'admin';
    const token = jwt.sign(
      {
        id: authedUser.id,
        username: authedUser.username,
        role: authedUser.role,
        super_admin: false,
        ...(isAdmin ? { flag: FLAGS.COOKIE_THEFT } : {}),
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('token', token, TOKEN_COOKIE_OPTIONS);

    const response = { id: authedUser.id, username: authedUser.username, role: authedUser.role };
    if (isSqli) {
      response.flag = FLAGS.SQLI;
      response.message = 'SQL Injection detected - nice bypass!';
    }
    res.json(response);
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

module.exports = router;
