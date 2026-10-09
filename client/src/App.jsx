import { useEffect, useState } from 'react';

const SAMPLE_JD = `Junior Full-Stack Developer

Requirements:
- React and modern JavaScript
- Node.js and Express, REST APIs
- MongoDB or SQL databases
- Git, unit testing

Nice to have:
- Docker
- TypeScript
- AWS basics`;

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function Pills({ items, kind }) {
  if (!items.length) return <p className="muted">None.</p>;
  return (
    <ul className="pills">
      {items.map((s) => (
        <li key={s.name} className={`pill ${kind}`}>
          {s.name}
          {s.level === 'nice' && <span className="tag">nice to have</span>}
        </li>
      ))}
    </ul>
  );
}

function Result({ r }) {
  const tone = r.score === null ? 'none' : r.score >= 75 ? 'good' : r.score >= 50 ? 'mid' : 'low';
  return (
    <section className="result" aria-live="polite">
      <div className="scorecard">
        <div className={`score ${tone}`} aria-label={`Match score ${r.score ?? 'unknown'}`}>
          {r.score === null ? '-' : r.score}
          <small>{r.score === null ? '' : '/100'}</small>
        </div>
        <div>
          <h2>{r.verdict}</h2>
          <p className="muted">
            {r.title} - {r.counts.jdSkills} skills found in the job, {r.counts.resumeSkills} in your resume.
          </p>
        </div>
      </div>
      <div className="cols">
        <div>
          <h3>Matched</h3>
          <Pills items={r.matched} kind="ok" />
        </div>
        <div>
          <h3>Missing</h3>
          <Pills items={r.missing} kind="miss" />
        </div>
      </div>
      {r.extra.length > 0 && (
        <div>
          <h3>On your resume, not asked for</h3>
          <Pills items={r.extra} kind="extra" />
        </div>
      )}
      {r.tips.length > 0 && (
        <div>
          <h3>What to do</h3>
          <ul className="tips">{r.tips.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = () => api('/api/analyses').then(setHistory).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const data = await api('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jd, title }),
      });
      setResult(data); loadHistory();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function open(id) {
    try { setResult(await api(`/api/analyses/${id}`)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (err) { setError(err.message); }
  }

  return (
    <div className="page">
      <header>
        <span className="brand">FitCheck</span>
        <a href="https://github.com/Aditya-Anand-create/fitcheck">Source on GitHub</a>
      </header>
      <main>
        <h1>Does your resume match the job?</h1>
        <p className="lede">Paste both. FitCheck lists the skills the job asks for, which ones your resume shows, and which are missing. No signup, no AI guessing: the matching rules are plain and open in the code.</p>

        <form onSubmit={submit}>
          <label>Role name (optional)
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Junior Full-Stack Developer, Acme" />
          </label>
          <div className="cols">
            <label>Your resume text
              <textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={14} placeholder="Paste the text of your resume" required />
            </label>
            <label>Job description
              <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={14} placeholder="Paste the job posting" required />
            </label>
          </div>
          <div className="actions">
            <button type="submit" disabled={busy}>{busy ? 'Checking...' : 'Check my fit'}</button>
            <button type="button" className="ghost" onClick={() => setJd(SAMPLE_JD)}>Use a sample job</button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>

        {result && <Result r={result} />}

        {history.length > 0 && (
          <section>
            <h3>Recent checks</h3>
            <ul className="history">
              {history.map((h) => (
                <li key={h.id}><button className="link" onClick={() => open(h.id)}>{h.title}</button><span>{h.score ?? '-'} - {h.verdict}</span></li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <footer>Built with React, Express and MongoDB. Scores are a keyword check, not a hiring prediction.</footer>
    </div>
  );
}
