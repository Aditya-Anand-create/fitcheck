const express = require('express');
const path = require('path');
const fs = require('fs');
const { analyze } = require('./analyze');
const { pdfToText, PdfError } = require('./pdf');

function createApp(store) {
  const app = express();
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true, storage: store.kind }));

  app.post('/api/parse-pdf', express.raw({ type: 'application/pdf', limit: '4mb' }), async (req, res) => {
    try {
      res.json({ text: await pdfToText(req.body) });
    } catch (err) {
      if (err instanceof PdfError) return res.status(422).json({ error: err.message });
      throw err;
    }
  });

  app.post('/api/analyze', async (req, res) => {
    const { resume, jd, title } = req.body || {};
    if (typeof resume !== 'string' || typeof jd !== 'string') {
      return res.status(400).json({ error: 'resume and jd must be text' });
    }
    if (resume.trim().length < 40 || jd.trim().length < 40) {
      return res.status(400).json({ error: 'Paste at least a few lines for both the resume and the job description.' });
    }
    const result = analyze(resume, jd);
    const label = typeof title === 'string' && title.trim() ? title.trim().slice(0, 80) : 'Untitled role';
    const id = await store.save({ title: label, score: result.score, verdict: result.verdict, result });
    res.json({ id, title: label, ...result });
  });

  app.get('/api/analyses', async (req, res) => res.json(await store.recent(10)));

  app.get('/api/analyses/:id', async (req, res) => {
    const doc = await store.get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, title: doc.title, ...doc.result });
  });

  const dist = path.join(__dirname, '..', '..', 'client', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'File is too big. Keep it under 4 MB.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Bad request body.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  });
  return app;
}

module.exports = { createApp };
