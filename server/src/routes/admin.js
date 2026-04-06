const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { FLAGS } = require('../flags');

const router = express.Router();

// GET /api/admin/dashboard
router.get('/dashboard', authenticate, requireAdmin, (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ?').get('purchase').total;

  const users = db.prepare(
    'SELECT id, username, email, role, balance, created_at FROM users'
  ).all();

  const response = {
    stats: {
      users: userCount,
      products: productCount,
      transactions: transactionCount,
      revenue: totalRevenue,
    },
    users,
    message: 'Welcome, Admin!',
  };

  // Flag only revealed to super_admin
  if (req.user.super_admin === true) {
    response.flag = FLAGS.JWT_FORGING;
    response.secret_message = 'You forged a super_admin token — impressive!';
  }

  res.json(response);
});

// PUT /api/admin/users/:id — modifier un utilisateur (admin)
router.put('/users/:id', authenticate, requireAdmin, (req, res) => {
  const { username, email, role, balance } = req.body;
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

  db.prepare(`
    UPDATE users
    SET username = COALESCE(?, username),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        balance = COALESCE(?, balance)
    WHERE id = ?
  `).run(username || null, email || null, role || null, balance !== undefined ? balance : null, userId);

  const updated = db.prepare(
    'SELECT id, username, email, role, balance, created_at FROM users WHERE id = ?'
  ).get(userId);

  res.json(updated);
});

module.exports = router;
