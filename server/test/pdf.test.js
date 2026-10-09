const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { createStore } = require('../src/store');

const PDFDocument = require('pdfkit');

function makePdf(lines) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    lines.forEach((l) => doc.text(l));
    doc.end();
  });
}

async function start() {
  const server = createApp(await createStore(undefined)).listen(0);
  return { server, url: `http://127.0.0.1:${server.address().port}/api/parse-pdf` };
}
const send = (url, body, type = 'application/pdf') => fetch(url, { method: 'POST', headers: { 'content-type': type }, body });

test('extracts text from a PDF', async () => {
  const { server, url } = await start();
  const pdf = await makePdf(['Aditya Anand - MCA student', 'Skills: React, Node.js, Express and MongoDB', 'Built a chatbot with streaming']);
  const r = await send(url, pdf);
  assert.equal(r.status, 200);
  const { text } = await r.json();
  assert.match(text, /React, Node\.js, Express and MongoDB/);
  server.closeAllConnections?.();
  server.close();
});

test('PDF with no text gets a clear error', async () => {
  const { server, url } = await start();
  const r = await send(url, await makePdf([]));
  assert.equal(r.status, 422);
  assert.match((await r.json()).error, /scan|No text/i);
  server.closeAllConnections?.();
  server.close();
});

test('non-PDF bytes are rejected', async () => {
  const { server, url } = await start();
  const r = await send(url, Buffer.from('just some text pretending to be a pdf'));
  assert.equal(r.status, 422);
  assert.match((await r.json()).error, /not a PDF/);
  server.closeAllConnections?.();
  server.close();
});

test('corrupt PDF is rejected without crashing the server', async () => {
  const { server, url } = await start();
  const r = await send(url, Buffer.from('%PDF-1.4\n1 0 obj\n<< garbage'));
  assert.equal(r.status, 422);
  assert.equal((await fetch(url.replace('parse-pdf', 'health'))).status, 200);
  server.closeAllConnections?.();
  server.close();
});

test('empty body and wrong content type', async () => {
  const { server, url } = await start();
  assert.equal((await send(url, '', 'application/pdf')).status, 422);
  assert.equal((await send(url, 'x', 'text/plain')).status, 422);
  server.closeAllConnections?.();
  server.close();
});

test('oversized upload returns 413', async () => {
  const { server, url } = await start();
  const r = await send(url, Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(5 * 1024 * 1024)]));
  assert.equal(r.status, 413);
  server.closeAllConnections?.();
  server.close();
});
