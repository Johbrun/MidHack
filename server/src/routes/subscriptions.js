const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const VALID_PLANS = ['free', 'premium'];

// GET /api/users/:id/subscription
router.get('/:id/subscription', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, subscription FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ subscription: user.subscription || 'free' });
});

// PUT /api/users/:id/subscription — legitimate purchase tunnel
router.put('/:id/subscription', authenticate, (req, res) => {
  const { plan } = req.body;
  if (!VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: 'Plan invalide. Valeurs acceptées : free, premium' });
  }
  const user = db.prepare('SELECT id, subscription FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Mangues are a fictional currency — no payment processing here
  db.prepare('UPDATE users SET subscription = ? WHERE id = ?').run(plan, req.params.id);

  const updated = db.prepare('SELECT id, subscription FROM users WHERE id = ?').get(req.params.id);
  res.json({ subscription: updated.subscription, message: 'Abonnement mis à jour avec succès' });
});

module.exports = router;
