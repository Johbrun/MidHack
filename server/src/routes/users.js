const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { FLAGS } = require('../flags');
const { awardFlag } = require('../award');

const router = express.Router();

// GET /api/users/:id
// VULNERABLE: IDOR - no check that req.user.id === params.id
router.get('/:id', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, bio, role, balance, subscription, created_at FROM users WHERE id = ?'
  ).get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// PUT /api/users/:id
// VULNERABLE: IDOR - can modify any user's profile
// VULNERABLE: Mass Assignment - accepts role field, allowing privilege escalation
router.put('/:id', authenticate, (req, res) => {
  const { email, bio, username, role, subscription } = req.body;
  const userId = req.params.id;

  const user = db.prepare('SELECT id, bio, role, subscription FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // L'écriture sur le profil d'autrui reste volontairement ouverte (IDOR), mais
  // la bio qui porte le flag IDOR est protégée : sans ça une équipe peut
  // l'écraser et détruire son propre challenge (base à réinitialiser).
  const bioHoldsFlag = (user.bio || '').includes(FLAGS.IDOR);
  const nextBio = bioHoldsFlag ? null : (bio || null);

  if (username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
    if (existing) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }
  }

  // VULNERABLE: role and subscription are updated from user input without authorization check
  db.prepare('UPDATE users SET email = COALESCE(?, email), bio = COALESCE(?, bio), username = COALESCE(?, username), role = COALESCE(?, role), subscription = COALESCE(?, subscription) WHERE id = ?')
    .run(email || null, nextBio, username || null, role || null, subscription || null, userId);

  const updated = db.prepare(
    'SELECT id, username, email, bio, role, balance, subscription, created_at FROM users WHERE id = ?'
  ).get(userId);

  // Le flag ne tombe que sur une vraie élévation de privilège via mass
  // assignment : passer premium sans payer, ou se donner le rôle admin.
  // Renvoyer 'free' (ou repasser premium alors qu'on l'est déjà) ne prouve rien.
  const gotPremium = subscription === 'premium' && user.subscription !== 'premium';
  const gotAdmin = role === 'admin' && user.role !== 'admin';

  // Deux exploitations distinctes du même défaut, donc deux challenges : le
  // flag « Go Premium » ne peut plus annoncer une élévation de rôle.
  // L'élévation de privilège est la plus spécifique, donc testée en premier.
  const response = { ...updated };
  if (gotAdmin) {
    awardFlag(req, response, 'PRIV_ESC_ROLE', {
      proof: 'mass_assignment_role',
      field: 'role',
      message: 'Champ « role » accepté depuis le body : élévation de privilège par mass assignment !',
    });
  }
  if (gotPremium) {
    awardFlag(req, response, 'MASS_ASSIGNMENT', {
      proof: 'mass_assignment_subscription',
      field: 'subscription',
      message: 'Champ « subscription » accepté depuis le body : Premium obtenu sans payer !',
    });
  }

  res.json(response);
});

module.exports = router;
