// Persistance JSON partagée (shared/json-store.js) : le classement du dashboard
// et le journal webhook du QG en dépendent. Un fichier illisible ne doit jamais
// être écrasé en silence, et une écriture ne doit jamais laisser de fichier
// temporaire derrière elle.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { writeJsonAtomic, readJson } = require('../shared/json-store');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'json-store-'));
}

test('writeJsonAtomic : crée le dossier, écrit le JSON et ne laisse aucun fichier temporaire', () => {
  const dir = tmpDir();
  const file = path.join(dir, 'nested', 'state.json');
  writeJsonAtomic(file, [{ name: 'Alpha' }]);
  writeJsonAtomic(file, [{ name: 'Bravo' }]);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf-8')), [{ name: 'Bravo' }]);
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['state.json']);
});

test('readJson : fichier absent → valeur par défaut', () => {
  const file = path.join(tmpDir(), 'missing.json');
  assert.deepEqual(readJson(file, { fallback: [] }), []);
});

test('readJson : JSON tronqué → valeur par défaut, et le fichier est mis de côté', () => {
  const dir = tmpDir();
  const file = path.join(dir, 'state.json');
  fs.writeFileSync(file, '[{"name": "Alp');
  const errors = [];
  const original = console.error;
  console.error = (msg) => errors.push(msg);
  try {
    assert.deepEqual(readJson(file, { fallback: [] }), []);
  } finally {
    console.error = original;
  }
  assert.equal(fs.existsSync(file), false);
  const aside = fs.readdirSync(dir).filter((f) => f.startsWith('state.json.corrupt-'));
  assert.equal(aside.length, 1);
  assert.equal(fs.readFileSync(path.join(dir, aside[0]), 'utf-8'), '[{"name": "Alp');
  assert.equal(errors.length, 1);
});

test('readJson : forme inattendue (validate) → valeur par défaut', () => {
  const file = path.join(tmpDir(), 'state.json');
  fs.writeFileSync(file, '{"not": "an array"}');
  const original = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(readJson(file, { fallback: [], validate: Array.isArray }), []);
  } finally {
    console.error = original;
  }
});
