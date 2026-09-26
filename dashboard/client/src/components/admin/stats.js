import { DIFFICULTIES, DIFFICULTY_POINTS, FLAGS } from '../../flags';

// Tout ce que la console affiche se déduit du classement diffusé en direct :
// aucune requête de plus, et les chiffres suivent le tableau projeté.

export const FLAG_BY_ID = Object.fromEntries(FLAGS.map((f) => [f.flagId, f]));

export function teamScore(team, hintPenalty) {
  if (team.score !== undefined) return team.score;
  const pts = team.captures.reduce((s, c) => s + (c.points || 0), 0);
  return pts - (team.hints || []).length * hintPenalty;
}

// Une ligne par challenge : résolutions, first blood, indices demandés.
export function challengeStats(teams) {
  const order = (d) => {
    const i = DIFFICULTIES.indexOf(d);
    return i === -1 ? DIFFICULTIES.length : i;
  };
  return FLAGS.map((f) => {
    const solves = [];
    let hints = 0;
    for (const t of teams) {
      const c = t.captures.find((x) => x.flagId === f.flagId);
      if (c) solves.push({ team: t.name, at: c.capturedAt, firstBlood: c.firstBlood });
      if ((t.hints || []).some((h) => h.challengeName === f.name)) hints += 1;
    }
    solves.sort((a, b) => a.at.localeCompare(b.at));
    return {
      ...f,
      points: DIFFICULTY_POINTS[f.difficulty] ?? 0,
      solves,
      firstBlood: solves.find((s) => s.firstBlood) || solves[0] || null,
      hints,
    };
  }).sort((a, b) => order(a.difficulty) - order(b.difficulty));
}

// Toutes les captures, la plus récente en tête.
export function recentCaptures(teams, limit = 10) {
  return teams
    .flatMap((t) => t.captures.map((c) => ({ ...c, team: t.name })))
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .slice(0, limit);
}

export function lastCaptureAt(team) {
  return team.captures.reduce((m, c) => (c.capturedAt > m ? c.capturedAt : m), '') || null;
}

// Redémarrages de services remontés par /api/admin/status, à plat.
export function restartList(status) {
  return Object.entries(status?.restarts || {}).flatMap(([team, boots]) =>
    Object.entries(boots)
      .filter(([, n]) => n > 0)
      .map(([service, count]) => ({ team, service, count }))
  );
}
