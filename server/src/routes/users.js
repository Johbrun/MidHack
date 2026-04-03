const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id
// VULNERABLE: IDOR — no check that req.user.id === params.id
router.get('/:id', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, bio, role, balance, created_at FROM users WHERE id = ?'
  ).get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// PUT /api/users/:id
// VULNERABLE: IDOR — can modify any user's profile
router.put('/:id', authenticate, (req, res) => {
  const { email, bio, username } = req.body;
  const userId = req.params.id;

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
    if (existing) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }
  }

  db.prepare('UPDATE users SET email = COALESCE(?, email), bio = COALESCE(?, bio), username = COALESCE(?, username) WHERE id = ?')
    .run(email || null, bio || null, username || null, userId);

  const updated = db.prepare(
    'SELECT id, username, email, bio, role, balance, created_at FROM users WHERE id = ?'
  ).get(userId);

  res.json(updated);
});

module.exports = router;
