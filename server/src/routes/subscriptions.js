const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { awardFlag } = require('../award');

const router = express.Router();
const VALID_PLANS = ['free', 'premium'];
// Prix officiels imposés côté serveur — mais le tunnel fait l'erreur de
// laisser le client fournir son propre prix (parameter tampering) : c'est là
// que se gagne le challenge « Free Premium ».
const PLAN_PRICES = { free: 0, premium: 100000000 };

// GET /api/users/:id/subscription
router.get('/:id/subscription', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, subscription FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ subscription: user.subscription || 'free' });
});

// PUT /api/users/:id/subscription — purchase tunnel
router.put('/:id/subscription', authenticate, (req, res) => {
  const { plan, price: clientPrice } = req.body;
  if (!VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: 'Plan invalide. Valeurs acceptées : free, premium' });
  }
  const user = db
    .prepare('SELECT id, subscription, balance FROM users WHERE id = ?')
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const officialPrice = PLAN_PRICES[plan];
  // VULNERABLE: Parameter Tampering — le prix facturé est repris depuis le body
  // client s'il est fourni, au lieu d'être imposé par le serveur. Un
  // `{ "plan": "premium", "price": 0 }` obtient donc premium sans débiter.
  const price = clientPrice !== undefined ? parseFloat(clientPrice) : officialPrice;
  if (isNaN(price)) {
    return res.status(400).json({ error: 'Prix invalide' });
  }

  if (price > user.balance) {
    return res.status(402).json({
      error: `Solde insuffisant : l'abonnement ${plan} coûte ${officialPrice} crédits, vous en avez ${user.balance}.`,
      nudge:
        "Le montant débité est-il vraiment décidé par le serveur ? Regardez ce que la requête envoie…",
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

  const response = {
    subscription: updated.subscription,
    balance: updated.balance,
    message: 'Abonnement mis à jour avec succès',
  };

  // Le flag récompense l'ACTE : premium activé en facturant moins que le prix
  // officiel (prix manipulé côté client). L'état « subscription=premium » seul
  // ne prouve rien — un achat légitime au bon prix le produit aussi.
  const gotPremiumCheap =
    plan === 'premium' && user.subscription !== 'premium' && price < officialPrice;
  if (gotPremiumCheap) {
    awardFlag(req, response, 'MASS_ASSIGNMENT', {
      proof: 'price_tampering',
      field: 'price',
      chargedPrice: price,
      officialPrice,
      message:
        `Premium activé en ne payant que ${price} au lieu de ${officialPrice} : ` +
        'le prix envoyé par le client a été facturé tel quel !',
    });
  }

  res.json(response);
});

module.exports = router;
