const express = require('express');
const path = require('path');
const fs = require('fs');
const { analyze } = require('./analyze');

function createApp(store) {
  const app = express();
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true, storage: store.kind }));

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
  return app;
}

module.exports = { createApp };
