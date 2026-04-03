const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { FLAGS } = require('../flags');

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
// VULNERABLE: Mass Assignment — accepts role field, allowing privilege escalation
router.put('/:id', authenticate, (req, res) => {
  const { email, bio, username, role } = req.body;
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

  // VULNERABLE: role is updated from user input without any authorization check
  db.prepare('UPDATE users SET email = COALESCE(?, email), bio = COALESCE(?, bio), username = COALESCE(?, username), role = COALESCE(?, role) WHERE id = ?')
    .run(email || null, bio || null, username || null, role || null, userId);

  const updated = db.prepare(
    'SELECT id, username, email, bio, role, balance, created_at FROM users WHERE id = ?'
  ).get(userId);

  const response = { ...updated };
  if (role === 'admin' && updated.role === 'admin') {
    response.flag = FLAGS.MASS_ASSIGNMENT;
    response.message = 'Privilege escalation réussie ! Vous êtes maintenant admin.';
  }

  res.json(response);
});

module.exports = router;
