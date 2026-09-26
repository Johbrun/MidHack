#!/usr/bin/env node
'use strict';

/**
 * Génère les portions de documentation dérivées du catalogue de challenges.
 *
 * Source unique de vérité :
 *   - shared/flags.json      → noms, codenames, difficulté, catégorie, `enabled`,
 *                              et la grille DIFFICULTY_POINTS.
 *   - server/src/flags.js    → libellé OWASP de chaque challenge (dans les
 *                              explications) — déjà son unique foyer.
 *
 * Le script ne DÉPLACE aucune donnée : il lit ces deux sources et réécrit
 * uniquement les zones balisées des fichiers Markdown, entre marqueurs :
 *   <!-- GEN:id -->…contenu généré…<!-- /GEN:id -->
 *
 * Usage :
 *   node scripts/gen-docs.js            # réécrit les docs
 *   node scripts/gen-docs.js --check    # échoue (exit 1) si une doc est périmée
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { DIFFICULTY_POINTS, CATEGORIES, CHALLENGES } = require(path.join(ROOT, 'shared/flags.json'));
const { FLAGS, FLAG_EXPLANATIONS } = require(path.join(ROOT, 'server/src/flags.js'));

const DIFF_ORDER = Object.keys(DIFFICULTY_POINTS); // Facile, Moyen, Difficile
const enabled = CHALLENGES.filter((c) => c.enabled);
const catsUsed = new Set(enabled.map((c) => c.category));

const pointsOf = (c) => DIFFICULTY_POINTS[c.difficulty] ?? 0;
const owaspOf = (c) => {
  const exp = FLAG_EXPLANATIONS[FLAGS[c.flagId]];
  return (exp && exp.owasp) || '—';
};

// ── Fragments dérivés ───────────────────────────────────────────────────────

const vulnTable = () => {
  const head =
    '| # | Vulnérabilité | Codename | Catégorie OWASP | Difficulté | Points | Actif |\n' +
    '| --- | --- | --- | --- | --- | --- | --- |';
  const rows = CHALLENGES.map(
    (c, i) =>
      `| ${i + 1} | ${c.name} | ${c.codename} | ${owaspOf(c)} | ${c.difficulty} | ${pointsOf(c)} | ${c.enabled ? '✅' : '❌'} |`,
  );
  return [head, ...rows].join('\n');
};

// « Facile=10 / Moyen=15 / Difficile=20 » et sa variante à virgules.
const pointsSlash = DIFF_ORDER.map((d) => `${d}=${DIFFICULTY_POINTS[d]}`).join(' / ');
const pointsComma = DIFF_ORDER.map((d) => `${d}=${DIFFICULTY_POINTS[d]}`).join(', ');

const FRAGMENTS = {
  // Bloc : sauts de ligne inclus pour que le tableau ne colle pas aux marqueurs.
  'vuln-table': `\n${vulnTable()}\n`,
  'points-slash': pointsSlash,
  'points-comma': pointsComma,
  count: String(enabled.length),
  cats: String(catsUsed.size),
};

// ── Application des marqueurs ────────────────────────────────────────────────

// Chaque cible déclare quels marqueurs elle contient (documentation + garde-fou
// : un marqueur listé mais absent du fichier fait échouer le script).
const TARGETS = [
  { file: 'README.md', ids: ['vuln-table', 'points-slash'] },
  { file: 'docs/DEV.md', ids: ['count', 'cats', 'points-comma'] },
];

const MARKER = (id) =>
  new RegExp(`(<!-- GEN:${id} -->)([\\s\\S]*?)(<!-- /GEN:${id} -->)`, 'g');

const check = process.argv.includes('--check');
let stale = 0;

for (const { file, ids } of TARGETS) {
  const abs = path.join(ROOT, file);
  const original = fs.readFileSync(abs, 'utf8');
  let next = original;

  for (const id of ids) {
    const re = MARKER(id);
    if (!re.test(next)) {
      console.error(`✗ ${file} : marqueur <!-- GEN:${id} --> introuvable`);
      process.exit(2);
    }
    next = next.replace(MARKER(id), (_m, open, _body, close) => `${open}${FRAGMENTS[id]}${close}`);
  }

  if (next !== original) {
    stale += 1;
    if (check) {
      console.error(`✗ ${file} est périmé (relancer : node scripts/gen-docs.js)`);
    } else {
      fs.writeFileSync(abs, next);
      console.log(`✓ ${file} régénéré`);
    }
  } else {
    console.log(`= ${file} à jour`);
  }
}

if (check && stale > 0) process.exit(1);
