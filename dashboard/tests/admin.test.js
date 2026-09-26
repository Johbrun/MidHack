// Le dashboard est aussi la console de l'animateur : minuteur, gel/dégel,
// reset, annonces, feedbacks, export, statut. Ces actions pilotent la séance en
// direct et ne sont couvertes par aucun autre test. On vérifie qu'elles sont
// bien protégées par le mot de passe admin et qu'elles produisent l'effet
// annoncé (y compris la diffusion WebSocket que voient les écrans projetés).
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  withDashboard,
  api,
  admin,
  connectWs,
  capture,
  scoreboard,
  scoreOf,
} = require('./helpers');

// ─── Contrôle d'accès ───

const PROTECTED = [
  ['POST', '/api/timer/start', { duration: 10 }],
  ['POST', '/api/timer/stop'],
  ['POST', '/api/reset'],
  ['POST', '/api/scoreboard/freeze'],
  ['POST', '/api/scoreboard/unfreeze'],
  ['POST', '/api/announce', { message: 'x' }],
  ['GET', '/api/feedback'],
  ['GET', '/api/feedback/export'],
  ['GET', '/api/admin/events'],
  ['GET', '/api/admin/status'],
  ['GET', '/api/export'],
];

test('Toutes les actions admin exigent le jeton : 401 sans jeton et avec un faux', async () => {
  await withDashboard(async (base) => {
    for (const [method, path, body] of PROTECTED) {
      const noToken = await api(base, method, path, body);
      assert.equal(noToken.status, 401, `${method} ${path} sans jeton doit être 401`);
      const badToken = await admin(base, method, path, body, 'mauvais');
      assert.equal(badToken.status, 401, `${method} ${path} avec un faux jeton doit être 401`);
    }
  });
});

test('admin/login : le bon mot de passe renvoie un jeton, le mauvais est refusé', async () => {
  await withDashboard(async (base) => {
    const ok = await api(base, 'POST', '/api/admin/login', { password: 'test-admin' });
    assert.equal(ok.status, 200);
    assert.ok(ok.data.token);
    const ko = await api(base, 'POST', '/api/admin/login', { password: 'nope' });
    assert.equal(ko.status, 401);
  });
});

// ─── Minuteur ───

test('Minuteur : start arme un compte à rebours, stop le désarme', async () => {
  await withDashboard(async (base) => {
    const started = await admin(base, 'POST', '/api/timer/start', { duration: 30 });
    assert.equal(started.status, 200);

    const running = (await api(base, 'GET', '/api/timer')).data;
    assert.equal(running.running, true);
    assert.equal(running.duration, 30);
    assert.ok(running.endTime > Date.now(), 'endTime doit être dans le futur');

    await admin(base, 'POST', '/api/timer/stop');
    const stopped = (await api(base, 'GET', '/api/timer')).data;
    assert.equal(stopped.running, false);
    assert.equal(stopped.endTime, null);
  });
});

test('Minuteur : une durée nulle ou négative est refusée (400)', async () => {
  await withDashboard(async (base) => {
    assert.equal((await admin(base, 'POST', '/api/timer/start', { duration: 0 })).status, 400);
    assert.equal((await admin(base, 'POST', '/api/timer/start', { duration: -5 })).status, 400);
  });
});

// ─── Gel / dégel ───

test('Gel : une capture reçue pendant le gel est mise en file, puis comptée au dégel', async () => {
  await withDashboard(async (base) => {
    await admin(base, 'POST', '/api/scoreboard/freeze');

    const queued = await capture(base, 'Alpha', 'IDOR');
    assert.equal(queued.data.queued, true, 'la capture doit être mise en file pendant le gel');
    assert.equal(scoreOf(await scoreboard(base), 'Alpha'), undefined, 'aucun point tant que gelé');

    const unfreeze = await admin(base, 'POST', '/api/scoreboard/unfreeze');
    assert.equal(unfreeze.data.replayed, 1, 'la capture en attente doit être rejouée');
    assert.ok(scoreOf(await scoreboard(base), 'Alpha') > 0, 'le score compte après dégel');
  });
});

// ─── Reset ───

test('Reset : vide le classement', async () => {
  await withDashboard(async (base) => {
    await capture(base, 'Alpha', 'IDOR');
    await capture(base, 'Bravo', 'SQLI');
    assert.equal((await scoreboard(base)).length, 2);

    const res = await admin(base, 'POST', '/api/reset');
    assert.equal(res.status, 200);
    assert.deepEqual(await scoreboard(base), []);
  });
});

// ─── Annonces (diffusées en WebSocket) ───

test('Annonce : message requis (400), sinon diffusé aux écrans connectés', async () => {
  await withDashboard(async (base) => {
    assert.equal((await admin(base, 'POST', '/api/announce', {})).status, 400);

    const ws = connectWs(base);
    await ws.ready;
    try {
      const res = await admin(base, 'POST', '/api/announce', { message: 'Pause dans 5 min' });
      assert.equal(res.status, 200);
      const msg = await ws.waitFor('announcement');
      assert.equal(msg.message, 'Pause dans 5 min');
    } finally {
      ws.close();
    }
  });
});

test('Gel : l\'état est diffusé en WebSocket aux clients', async () => {
  await withDashboard(async (base) => {
    const ws = connectWs(base);
    await ws.ready;
    try {
      await admin(base, 'POST', '/api/scoreboard/freeze');
      const msg = await ws.waitFor('freeze');
      assert.equal(msg.frozen, true);
    } finally {
      ws.close();
    }
  });
});

// ─── Statut / événements ───

test('Statut : reflète le nombre d\'équipes, le gel et le minuteur', async () => {
  await withDashboard(async (base) => {
    await capture(base, 'Alpha', 'IDOR');
    await admin(base, 'POST', '/api/scoreboard/freeze');
    await admin(base, 'POST', '/api/timer/start', { duration: 15 });

    const status = (await admin(base, 'GET', '/api/admin/status')).data;
    assert.equal(status.teamCount, 1);
    assert.ok(status.teams.includes('Alpha'));
    assert.equal(status.frozen, true);
    assert.equal(status.timer.running, true);
  });
});

test('Événements : un challenge-event est enregistré puis filtrable par équipe', async () => {
  await withDashboard(async (base) => {
    await api(base, 'POST', '/api/challenge-event', { teamName: 'Alpha', flagId: 'IDOR', kind: 'flag_awarded' });
    await api(base, 'POST', '/api/challenge-event', { teamName: 'Bravo', flagId: 'SQLI', kind: 'flag_awarded' });

    const all = (await admin(base, 'GET', '/api/admin/events')).data.events;
    assert.equal(all.length, 2);

    const alpha = (await admin(base, 'GET', '/api/admin/events?team=Alpha')).data.events;
    assert.equal(alpha.length, 1);
    assert.equal(alpha[0].teamName, 'Alpha');
  });
});

// ─── Feedbacks ───

test('Feedback : déposé sans auth, listé et exporté côté admin', async () => {
  await withDashboard(async (base) => {
    const posted = await api(base, 'POST', '/api/feedback', {
      teamName: 'Alpha',
      answers: [{ id: 'q1', question: 'Avis ?', answer: 'Génial' }],
    });
    assert.equal(posted.status, 200);

    const list = (await admin(base, 'GET', '/api/feedback')).data.feedbacks;
    assert.equal(list.length, 1);
    assert.equal(list[0].teamName, 'Alpha');

    const exported = await admin(base, 'GET', '/api/feedback/export');
    assert.match(exported.contentType, /text\/plain/);
    assert.match(exported.data, /Génial/);
  });
});

test('Feedback : une soumission sans réponse est refusée (400)', async () => {
  await withDashboard(async (base) => {
    assert.equal((await api(base, 'POST', '/api/feedback', { teamName: 'Alpha', answers: [] })).status, 400);
  });
});

// ─── Export du classement ───

test('Export : JSON par défaut, CSV sur demande', async () => {
  await withDashboard(async (base) => {
    await capture(base, 'Alpha', 'IDOR');

    const json = (await admin(base, 'GET', '/api/export')).data;
    assert.ok(Array.isArray(json.teams));
    assert.equal(json.teams[0].name, 'Alpha');

    const csv = await admin(base, 'GET', '/api/export?format=csv');
    assert.match(csv.contentType, /text\/csv/);
    const [header, firstRow] = csv.data.split('\n');
    assert.equal(header, 'rank,team,score,captures,hints,first_capture');
    assert.match(firstRow, /^1,Alpha,/);
  });
});
