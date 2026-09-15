// Point de sortie unique des flags.
//
// Avant ce module, chaque route posait `response.flag = FLAGS.X` de son côté :
// personne n'avait de vue d'ensemble, donc rien ne pouvait arbitrer entre deux
// conditions qui tombaient sur la même requête, ni distinguer une exploitation
// réelle d'un effet de bord. Trois garanties sont portées ici :
//
//   1. Preuve obligatoire  — pas de `proof`, pas de flag. La condition doit
//      décrire l'ACTE, jamais un état que d'autres chemins peuvent produire.
//   2. Un flag par requête — si deux conditions matchent, la première l'emporte.
//      Les appels sont donc ordonnés du plus spécifique au plus général dans
//      chaque route ; le flag écarté est journalisé et reste à trouver.
//   2bis. Prérequis    — un challenge du fil rouge ne se valide pas hors de son
//      ordre : `requires` dans shared/flags.json, captures lues sur le dashboard.
//   3. Journal            — chaque décision est tracée dans `challenge_events`,
//      ce qui donne à l'animateur le CHEMIN de chaque validation.
const db = require('./db');
const { FLAGS } = require('./flags');
const { CHALLENGES } = require('../../shared/flags.json');
const progress = require('./progress');

const CHALLENGE_BY_ID = new Map(CHALLENGES.map((c) => [c.flagId, c]));

// Types d'événements journalisés (cf. les trois classes de réponse, docs/RETOURS-TESTEUR.md).
const KIND = {
  AWARD: 'award',         // exploitation réelle, preuve fournie -> flag délivré
  WITHHELD: 'withheld',   // un flag a déjà été délivré sur cette requête
  LOCKED: 'locked',       // prérequis du fil rouge non satisfaits
};

function logEvent(req, { flagId, kind, proof, detail }) {
  try {
    db.prepare(
      `INSERT INTO challenge_events (user_id, username, flag_id, kind, proof, endpoint, detail)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.user?.id ?? null,
      req.user?.username ?? null,
      flagId,
      kind,
      proof ?? null,
      `${req.method} ${req.baseUrl || ''}${req.path}`,
      detail ? JSON.stringify(detail) : null
    );
  } catch (err) {
    // Le journal ne doit jamais faire échouer une requête de jeu.
    console.error('challenge_events insert failed:', err.message);
  }
}

/**
 * Délivre le flag d'un challenge sur la réponse en cours, si et seulement si
 * l'exploitation est prouvée et qu'aucun autre flag n'a déjà été délivré.
 *
 * @param {import('express').Request} req
 * @param {object} response  objet de réponse en cours de construction (muté)
 * @param {string} flagId    clé dans FLAGS (ex: 'ZERO_RATING')
 * @param {object} evidence  { proof: string, message?: string, ...détail }
 * @returns {boolean} true si le flag a été délivré
 */
function awardFlag(req, response, flagId, evidence = {}) {
  const challenge = CHALLENGE_BY_ID.get(flagId);

  // Un challenge désactivé pour l'événement ne délivre rien.
  if (!challenge || !challenge.enabled) return false;

  // Preuve obligatoire : c'est ce qui force les conditions à porter sur l'acte.
  if (!evidence.proof) {
    console.error(`awardFlag(${flagId}) appelé sans preuve — flag non délivré`);
    return false;
  }

  const { proof, message, ...detail } = evidence;

  // Un seul flag par requête : deux vulnérabilités ne se découvrent pas d'un coup.
  if (req._awardedFlagId) {
    logEvent(req, { flagId, kind: KIND.WITHHELD, proof, detail: { ...detail, awarded: req._awardedFlagId } });
    return false;
  }

  // Prérequis : un challenge tiroir ne se valide pas hors de son fil rouge,
  // ce qui coupe court aux validations par effet de bord.
  const missing = (challenge.requires || []).filter((id) => !progress.hasCaptured(id));
  if (missing.length) {
    logEvent(req, { flagId, kind: KIND.LOCKED, proof, detail: { ...detail, missing } });
    const names = missing.map((id) => CHALLENGE_BY_ID.get(id)?.name || id);
    response.message =
      `L'action a bien abouti, mais ce challenge s'inscrit dans un fil rouge : ` +
      `validez d'abord ${names.map((n) => `« ${n} »`).join(', ')}.`;
    return false;
  }

  req._awardedFlagId = flagId;
  logEvent(req, { flagId, kind: KIND.AWARD, proof, detail });

  response.flag = FLAGS[flagId];
  response.flagName = challenge.name;
  response.message = message || `Challenge « ${challenge.name} » validé !`;
  return true;
}

module.exports = { awardFlag, logEvent, KIND, CHALLENGE_BY_ID };
