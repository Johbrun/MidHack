// Le dashboard est l'autorité de score le jour J : il recalcule les points
// depuis son propre barème (jamais ceux de la requête), attribue le first blood
// une seule fois, refuse les challenges inconnus/désactivés et départage les
// égalités. Ces règles ne sont couvertes par aucun autre test.
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  withDashboard,
  capture,
  hint,
  scoreboard,
  scoreOf,
  rankOf,
  basePoints,
  HINT_PENALTY,
  FIRST_BLOOD_BONUS,
} = require('./helpers');

test('Barème dérivé du flagId + first blood : la 1re équipe touche le bonus, pas la 2e', async () => {
  await withDashboard(async (base) => {
    const first = await capture(base, 'Alpha', 'IDOR'); // Facile = 10
    assert.equal(first.data.firstBlood, true);
    const second = await capture(base, 'Bravo', 'IDOR');
    assert.equal(second.data.firstBlood, false);

    const teams = await scoreboard(base);
    assert.equal(scoreOf(teams, 'Alpha'), basePoints('IDOR') + FIRST_BLOOD_BONUS);
    assert.equal(scoreOf(teams, 'Bravo'), basePoints('IDOR'));
  });
});

test('Un `points` forgé dans la requête est ignoré : seul le barème compte', async () => {
  await withDashboard(async (base) => {
    await capture(base, 'Gamma', 'SQLI', { points: 9999 }); // Moyen = 15 (+5 first blood)
    const teams = await scoreboard(base);
    assert.equal(scoreOf(teams, 'Gamma'), basePoints('SQLI') + FIRST_BLOOD_BONUS);
  });
});

test('Un challenge désactivé ou inconnu ne rapporte rien (400, aucune équipe créée)', async () => {
  await withDashboard(async (base) => {
    const disabled = await capture(base, 'Delta', 'CSRF'); // enabled:false
    const unknown = await capture(base, 'Delta', 'NOPE_DOES_NOT_EXIST');
    assert.equal(disabled.status, 400);
    assert.equal(unknown.status, 400);

    const teams = await scoreboard(base);
    assert.equal(scoreOf(teams, 'Delta'), undefined, 'aucune équipe ne doit être créée par un flag refusé');
  });
});

test('Doublon : le même flag capturé deux fois ne compte qu\'une fois', async () => {
  await withDashboard(async (base) => {
    await capture(base, 'Echo', 'SSRF'); // Difficile = 20 (+5)
    const again = await capture(base, 'Echo', 'SSRF');
    assert.equal(again.data.duplicate, true);

    const teams = await scoreboard(base);
    assert.equal(scoreOf(teams, 'Echo'), basePoints('SSRF') + FIRST_BLOOD_BONUS);
  });
});

test('Pénalité d\'indice : le score baisse de HINT_PENALTY', async () => {
  await withDashboard(async (base) => {
    await capture(base, 'Foxtrot', 'IDOR'); // 10 + 5 = 15
    const before = scoreOf(await scoreboard(base), 'Foxtrot');
    await hint(base, 'Foxtrot', 'IDOR'); // challengeName = nom du challenge
    const after = scoreOf(await scoreboard(base), 'Foxtrot');
    assert.equal(after, before - HINT_PENALTY);
  });
});

test('Classement : à score égal, l\'équipe qui a marqué en premier est mieux classée', async () => {
  await withDashboard(async (base) => {
    // Deux challenges Difficile différents → chacune fait un first blood :
    // même score (20 + 5) et même nombre de captures (1). Seul le temps départage.
    await capture(base, 'Early', 'SSRF');
    await capture(base, 'Late', 'STORED_XSS');

    const teams = await scoreboard(base);
    assert.equal(scoreOf(teams, 'Early'), scoreOf(teams, 'Late'), 'les deux scores doivent être égaux');
    assert.ok(rankOf(teams, 'Early') < rankOf(teams, 'Late'), 'Early (1re capture) doit précéder Late');
  });
});

test('Classement : le score le plus élevé passe devant', async () => {
  await withDashboard(async (base) => {
    await capture(base, 'Low', 'IDOR'); // 15
    await capture(base, 'High', 'SSRF'); // 25
    const teams = await scoreboard(base);
    assert.ok(rankOf(teams, 'High') < rankOf(teams, 'Low'));
  });
});
