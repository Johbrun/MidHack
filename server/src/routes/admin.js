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

  res.json({
    stats: {
      users: userCount,
      products: productCount,
      transactions: transactionCount,
      revenue: totalRevenue,
    },
    flag: FLAGS.JWT_FORGING,
    message: 'Welcome, Admin! Here is your flag for accessing the admin panel.',
  });
});

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, (req, res) => {
  const users = db.prepare(
    'SELECT id, username, email, role, balance, created_at FROM users'
  ).all();

  res.json(users);
});

// GET /api/admin/flag — SQL Injection flag (shown after SQLI login)
router.get('/sqli-flag', authenticate, requireAdmin, (req, res) => {
  res.json({
    flag: FLAGS.SQLI,
    message: 'You successfully logged in as admin!',
  });
});

module.exports = router;
