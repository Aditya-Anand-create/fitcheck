const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { createStore } = require('../src/store');

async function start() {
  const store = await createStore(undefined);
  const server = createApp(store).listen(0);
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}
const post = (base, body) => fetch(base + '/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('analyze, save, and fetch back', async () => {
  const { server, base } = await start();
  const resume = 'React Node.js Express MongoDB project with Git. '.repeat(5);
  const jd = 'Requirements: React, Node.js and Docker experience. '.repeat(2);
  const r = await post(base, { resume, jd, title: 'Demo role' });
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.title, 'Demo role');
  const back = await (await fetch(`${base}/api/analyses/${data.id}`)).json();
  assert.equal(back.score, data.score);
  const list = await (await fetch(base + '/api/analyses')).json();
  assert.equal(list.length, 1);
  server.closeAllConnections?.();
  server.close();
});

test('rejects short or non-text input', async () => {
  const { server, base } = await start();
  assert.equal((await post(base, { resume: 'hi', jd: 'there' })).status, 400);
  assert.equal((await post(base, { resume: 5, jd: {} })).status, 400);
  assert.equal((await fetch(base + '/api/analyses/nope')).status, 404);
  server.closeAllConnections?.();
  server.close();
});
