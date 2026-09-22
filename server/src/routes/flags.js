const express = require('express');
const { ALL_FLAGS, ENABLED_FLAGS, FLAG_POINTS, FLAG_EXPLANATIONS, FLAG_IDS } = require('../flags');

const router = express.Router();

const { missingPrerequisites, challengeName, challengeCodename } = require('../award');

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5000';
const TEAM_NAME = process.env.TEAM_NAME || 'Unknown Team';
// Jeton d'équipe : prouve au dashboard que la capture vient bien du service de
// cette équipe, et pas d'une requête forgée au nom d'une autre.
const TEAM_TOKEN = process.env.TEAM_TOKEN || '';

// Un flag est presque toujours copié depuis une réponse JSON : il arrive avec
// ses guillemets, une virgule, parfois toute la ligne autour. Refuser ça au
// motif de « flag invalide » fait croire au joueur qu'il s'est trompé de flag.
const FLAG_PATTERN = /ASY\{[^}]*\}/;

function normalizeFlag(raw) {
  if (typeof raw !== 'string') return '';
  const match = raw.match(FLAG_PATTERN);
  return match ? match[0] : raw.trim().replace(/^["'`,\s]+|["'`,\s]+$/g, '');
}

// POST /api/flags/submit
router.post('/submit', async (req, res) => {
  const flag = normalizeFlag(req.body.flag);

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

  const flagId = FLAG_IDS[flag] || 'UNKNOWN';
  // Deux noms, deux publics : le classement reçoit le nom de la vulnérabilité,
  // le joueur reçoit le nom court sous lequel la carte figure dans son QG.
  const flagName = challengeName(flagId);
  const flagCodename = challengeCodename(flagId);

  // Le fil rouge s'applique aussi ici : un flag dont la valeur a été aperçue
  // hors de son parcours (extraction d'une table, épaule d'un voisin) ne
  // rapporte rien tant que ses prérequis ne sont pas validés.
  const missing = missingPrerequisites(flagId);
  if (missing.length) {
    return res.status(400).json({
      error: `Ce challenge s'inscrit dans un fil rouge : validez d'abord ${missing.map((id) => `« ${challengeCodename(id)} »`).join(', ')}.`,
      valid: false,
    });
  }
  const flagInfo = FLAG_POINTS[flag] || { points: 0, difficulty: 'Unknown' };

  // Notify the central dashboard and respect its response (e.g. frozen state)
  let queuedMessage = null;
  let duplicate = false;
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
    // Déjà capturé par l'équipe : le dire, plutôt que de laisser croire que
    // des points viennent d'être marqués une seconde fois.
    if (dashData.duplicate) duplicate = true;
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
    duplicate,
    message: queuedMessage
      || (duplicate
        ? `Flag « ${flagCodename} » déjà capturé par votre équipe : aucun point supplémentaire.`
        : `Bravo ! Vous avez trouvé le flag « ${flagCodename} » ! (+${flagInfo.points} pts)`),
    explanation,
  });
});

module.exports = router;
