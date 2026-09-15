const express = require('express');
const { ALL_FLAGS, ENABLED_FLAGS, FLAG_NAMES, FLAG_POINTS, FLAG_EXPLANATIONS, FLAG_IDS } = require('../flags');

const router = express.Router();

const { CHALLENGES } = require('../../../shared/flags.json');
const progress = require('../progress');

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5000';
const TEAM_NAME = process.env.TEAM_NAME || 'Unknown Team';
// Jeton d'équipe : prouve au dashboard que la capture vient bien du service de
// cette équipe, et pas d'une requête forgée au nom d'une autre.
const TEAM_TOKEN = process.env.TEAM_TOKEN || '';

// POST /api/flags/submit
router.post('/submit', async (req, res) => {
  const { flag } = req.body;

  if (!flag) {
    return res.status(400).json({ error: 'Flag is required' });
  }

  if (!ALL_FLAGS.includes(flag)) {
    return res.status(400).json({ error: 'Invalid flag', valid: false });
  }

  // Un flag valide mais dont le challenge est désactivé ne rapporte rien :
  // sinon une équipe marque des points sur un challenge absent de sa liste.
  if (!ENABLED_FLAGS.includes(flag)) {
    return res.status(400).json({
      error: "Ce flag appartient à un challenge désactivé pour cet événement : il ne rapporte aucun point.",
      valid: false,
    });
  }

  const flagName = FLAG_NAMES[flag] || 'Unknown';
  const flagId = FLAG_IDS[flag] || 'UNKNOWN';

  // Le fil rouge s'applique aussi ici : un flag dont la valeur a été aperçue
  // hors de son parcours (extraction d'une table, épaule d'un voisin) ne
  // rapporte rien tant que ses prérequis ne sont pas validés.
  const challenge = CHALLENGES.find((c) => c.flagId === flagId);
  const missing = (challenge?.requires || []).filter((id) => !progress.hasCaptured(id));
  if (missing.length) {
    const names = missing.map((id) => CHALLENGES.find((c) => c.flagId === id)?.name || id);
    return res.status(400).json({
      error: `Ce challenge s'inscrit dans un fil rouge : validez d'abord ${names.map((n) => `« ${n} »`).join(', ')}.`,
      valid: false,
    });
  }
  const flagInfo = FLAG_POINTS[flag] || { points: 0, difficulty: 'Unknown' };

  // Notify the central dashboard and respect its response (e.g. frozen state)
  let queuedMessage = null;
  try {
    const dashRes = await fetch(`${DASHBOARD_URL}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Team-Token': TEAM_TOKEN },
      body: JSON.stringify({ teamName: TEAM_NAME, flag, flagId, flagName }),
    });
    const dashData = await dashRes.json().catch(() => ({}));
    if (!dashRes.ok) {
      return res.status(dashRes.status).json({ error: dashData.error || 'Erreur du dashboard', valid: false });
    }
    // Scoreboard gelé : la capture est en file d'attente côté dashboard.
    if (dashData.queued) queuedMessage = dashData.message;
  } catch {
    // Dashboard might not be running in dev mode — continue anyway
  }

  const explanation = FLAG_EXPLANATIONS[flag] || null;

  res.json({
    valid: true,
    flagId,
    flagName,
    points: flagInfo.points,
    difficulty: flagInfo.difficulty,
    queued: !!queuedMessage,
    message: queuedMessage
      || `Congratulations! You found the ${flagName} flag! (+${flagInfo.points} pts)`,
    explanation,
  });
});

module.exports = router;
