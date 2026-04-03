const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
const { FLAGS } = require('../flags');

const router = express.Router();

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
    JWT_SECRET
  );

  res.cookie('token', token, { httpOnly: false, sameSite: 'lax', path: '/' });
  res.json({ id: result.lastInsertRowid, username, role: 'user' });
});

// GET /api/auth/exists
// VULNERABLE: User Enumeration — reveals whether a username exists
router.get('/exists', (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
  const response = { exists: !!user };
  if (user) {
    response.flag = FLAGS.USER_ENUM;
    response.message = 'Cet endpoint révèle l\'existence des utilisateurs — User Enumeration !';
  }
  res.json(response);
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
    const user = db.prepare(`SELECT * FROM users WHERE username = '${username}'`).get();

    if (!user) {
      // VULNERABLE: Different error message reveals user doesn't exist (User Enumeration)
      return res.status(401).json({ error: 'Utilisateur introuvable' });
    }

    // Password check is bypassed when SQL injection returns a row
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      // Still allow login if SQL injection was used (user row was found via injection)
      // This check is intentionally weak — the SQLi already returned the admin row
      if (!username.includes("'")) {
        // VULNERABLE: Different error message reveals that the user exists but password is wrong
        return res.status(401).json({ error: 'Mot de passe incorrect' });
      }
    }

    const isSqli = username.includes("'");

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, super_admin: false },
      JWT_SECRET
    );

    res.cookie('token', token, { httpOnly: false, sameSite: 'lax', path: '/' });

    const response = { id: user.id, username: user.username, role: user.role };
    if (isSqli) {
      response.flag = FLAGS.SQLI;
      response.message = 'SQL Injection detected — nice bypass!';
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
