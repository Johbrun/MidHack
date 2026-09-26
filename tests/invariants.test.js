// Garde-fou de cohérence du catalogue.
//
// `shared/flags.json` est la source unique (noms, difficulté, catégorie,
// `enabled`, barème). `server/src/flags.js` maintient à la main, en regard, les
// valeurs de flags et les explications (dont le libellé OWASP). Les fronts
// (client, dashboard, exploit-server) ne font que ré-exporter le JSON partagé,
// ils ne peuvent donc pas diverger. Ce test verrouille l'accord entre le
// catalogue partagé et ce qui est maintenu à la main côté serveur — c'est la
// dérive qui, sinon, revient en silence (barème périmé, flag orphelin…).
const test = require('node:test');
const assert = require('node:assert/strict');

const shared = require('../shared/flags.json');
const serverFlags = require('../server/src/flags.js');

const { DIFFICULTY_POINTS, CATEGORIES, CHALLENGES } = shared;
const { FLAGS, FLAG_EXPLANATIONS, FLAG_POINTS, ENABLED_FLAGS } = serverFlags;

const enabled = CHALLENGES.filter((c) => c.enabled);
const flagIds = new Set(CHALLENGES.map((c) => c.flagId));

test('Aucun flag orphelin : shared/flags.json et server/src/flags.js listent les mêmes challenges', () => {
  const sharedIds = [...flagIds].sort();
  const serverIds = Object.keys(FLAGS).sort();
  assert.deepEqual(serverIds, sharedIds, 'FLAGS (serveur) doit couvrir exactement les flagId du catalogue');
});

test('Chaque flagId a une valeur ASY{…} unique', () => {
  const values = Object.values(FLAGS);
  assert.equal(new Set(values).size, values.length, 'les valeurs de flag doivent être uniques');
  for (const [id, value] of Object.entries(FLAGS)) {
    assert.match(value, /^ASY\{.+\}$/, `${id} : format de flag inattendu`);
  }
});

test('Chaque challenge a une difficulté et une catégorie connues', () => {
  for (const c of CHALLENGES) {
    assert.ok(DIFFICULTY_POINTS[c.difficulty] !== undefined, `${c.flagId} : difficulté « ${c.difficulty} » absente de DIFFICULTY_POINTS`);
    assert.ok(CATEGORIES[c.category], `${c.flagId} : catégorie « ${c.category} » absente de CATEGORIES`);
    assert.ok(c.name && c.codename, `${c.flagId} : name/codename manquant`);
  }
});

test('Les prérequis (`requires`) pointent tous vers des challenges existants', () => {
  for (const c of CHALLENGES) {
    for (const dep of c.requires ?? []) {
      assert.ok(flagIds.has(dep), `${c.flagId} : prérequis inconnu « ${dep} »`);
    }
  }
});

test('Chaque challenge activé a une explication complète (danger, fix, owasp, code, quiz)', () => {
  for (const c of enabled) {
    const exp = FLAG_EXPLANATIONS[FLAGS[c.flagId]];
    assert.ok(exp, `${c.flagId} : aucune explication`);
    for (const field of ['danger', 'fix', 'owasp', 'vulnerableCode', 'fixedCode', 'quiz']) {
      assert.ok(exp[field], `${c.flagId} : champ d'explication « ${field} » manquant`);
    }
    assert.match(exp.owasp, /^A\d{2}:\d{4}/, `${c.flagId} : libellé OWASP inattendu (${exp.owasp})`);
  }
});

test('Le barème serveur (FLAG_POINTS) dérive bien de la difficulté du catalogue', () => {
  for (const c of CHALLENGES) {
    const entry = FLAG_POINTS[FLAGS[c.flagId]];
    assert.ok(entry, `${c.flagId} : absent de FLAG_POINTS`);
    assert.equal(entry.difficulty, c.difficulty, `${c.flagId} : difficulté serveur ≠ catalogue`);
    assert.equal(entry.points, DIFFICULTY_POINTS[c.difficulty], `${c.flagId} : points serveur ≠ barème`);
  }
});

test('ENABLED_FLAGS (serveur) correspond exactement aux challenges activés', () => {
  const expected = enabled.map((c) => FLAGS[c.flagId]).sort();
  assert.deepEqual([...ENABLED_FLAGS].sort(), expected);
});

test('Le score maximum est strictement positif et cohérent', () => {
  const maxScore = enabled.reduce((s, c) => s + DIFFICULTY_POINTS[c.difficulty], 0);
  assert.ok(maxScore > 0, 'le score maximum doit être positif');
  // Recalcul par un autre chemin (via FLAG_POINTS) : les deux doivent coïncider.
  const viaServer = enabled.reduce((s, c) => s + FLAG_POINTS[FLAGS[c.flagId]].points, 0);
  assert.equal(viaServer, maxScore);
});
