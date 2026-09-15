// Progression de l'équipe, vue depuis le site vulnérable.
//
// La source de vérité des captures est le dashboard (un flag n'est capturé que
// lorsqu'il a été soumis). Le site en garde un instantané rafraîchi en tâche de
// fond, ce qui permet à awardFlag() de rester synchrone dans les routes.
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5000';
const TEAM_NAME = process.env.TEAM_NAME || 'Unknown Team';
const REFRESH_MS = 5000;

let captured = new Set();
let reachable = false;
let timer = null;

async function refresh() {
  try {
    const resp = await fetch(`${DASHBOARD_URL}/api/scoreboard`, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) throw new Error(`dashboard ${resp.status}`);
    const data = await resp.json();
    const team = (data.teams || []).find((t) => t.name === TEAM_NAME);
    captured = new Set((team?.captures || []).map((c) => c.flagId).filter(Boolean));
    reachable = true;
  } catch {
    // Dashboard injoignable (dev local, redémarrage) : on ne bloque pas le jeu,
    // les prérequis sont considérés comme satisfaits.
    reachable = false;
  }
}

function start() {
  if (timer) return;
  refresh();
  timer = setInterval(refresh, REFRESH_MS);
  timer.unref?.();
}

// `true` dès que le dashboard est injoignable : un incident d'infra ne doit
// jamais verrouiller des challenges.
function hasCaptured(flagId) {
  return !reachable || captured.has(flagId);
}

function capturedFlagIds() {
  return [...captured];
}

module.exports = { start, refresh, hasCaptured, capturedFlagIds };
