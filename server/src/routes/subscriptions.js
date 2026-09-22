const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const VALID_PLANS = ['free', 'premium'];
// Le tunnel d'achat doit rester hors de portée : sinon il faisait passer
// premium sans rien débiter, et le participant croyait avoir réussi le
// challenge « Go Premium » alors que le flag ne tombe que par mass assignment.
const PLAN_PRICES = { free: 0, premium: 100000000 };

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
  const user = db
    .prepare('SELECT id, subscription, balance FROM users WHERE id = ?')
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const price = PLAN_PRICES[plan];
  if (price > user.balance) {
    return res.status(402).json({
      error: `Solde insuffisant : l'abonnement ${plan} coûte ${price} crédits, vous en avez ${user.balance}.`,
      nudge:
        "Le tunnel d'achat officiel est bien gardé. Une autre route touche pourtant au même champ…",
    });
  }

  db.prepare('UPDATE users SET subscription = ?, balance = balance - ? WHERE id = ?').run(
    plan,
    price,
    req.params.id
  );

  const updated = db
    .prepare('SELECT id, subscription, balance FROM users WHERE id = ?')
    .get(req.params.id);
  res.json({
    subscription: updated.subscription,
    balance: updated.balance,
    message: 'Abonnement mis à jour avec succès',
  });
});

module.exports = router;
