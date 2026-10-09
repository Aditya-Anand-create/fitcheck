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
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function SkillList({ items, empty }) {
  if (!items.length) return <p className="none">{empty}</p>;
  return (
    <ul className="skills">
      {items.map((s) => (
        <li key={s.name}>
          <span>{s.name}</span>
          <em>{s.level === 'nice' ? 'nice to have' : s.category}</em>
        </li>
      ))}
    </ul>
  );
}

function Result({ r }) {
  const tone = r.score === null ? 'none' : r.score >= 75 ? 'good' : r.score >= 50 ? 'mid' : 'low';
  return (
    <section className="result" aria-live="polite">
      <div className="verdict">
        <div className={`big ${tone}`}>{r.score === null ? '--' : r.score}</div>
        <div>
          <h2>{r.verdict}</h2>
          <p>
            {r.title}. The job names {r.counts.jdSkills} skills I know; your resume shows {r.counts.resumeSkills}.
          </p>
        </div>
      </div>

      <div className="split">
        <div>
          <h3>You have</h3>
          <SkillList items={r.matched} empty="Nothing from the job post shows up on your resume." />
        </div>
        <div>
          <h3 className="warn">You don't show</h3>
          <SkillList items={r.missing} empty="Nothing missing." />
        </div>
      </div>

      {r.extra.length > 0 && (
        <p className="extra">
          <b>On your resume, not in the post:</b> {r.extra.map((s) => s.name).join(', ')}.
        </p>
      )}

      {r.tips.length > 0 && (
        <div className="notes">
          <h3>Notes</h3>
          <ol>{r.tips.map((t) => <li key={t}>{t}</li>)}</ol>
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
  const [fileName, setFileName] = useState('');

  const loadHistory = () => api('/api/analyses').then(setHistory).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jd, title }),
      });
      setResult(data);
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function pickPdf(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (file.size > 4 * 1024 * 1024) return setError('That file is over 4 MB.');
    setBusy(true);
    try {
      const res = await fetch('/api/parse-pdf', { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: file });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not read that file.');
      setResume(data.text);
      setFileName(file.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function open(id) {
    try {
      setResult(await api(`/api/analyses/${id}`));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <aside>
        <p className="mark">FitCheck</p>
        <h1>Paste the job. Paste your resume. See what's missing.</h1>
        <p className="about">
          I got tired of guessing why applications went nowhere, so this lines up the skills in a job post against
          what your resume actually says. It matches keywords from a list I wrote by hand. No model is
          guessing, and the rules are in the repo.
        </p>
        <p className="about small">
          It can't tell how well you know something, and it only knows about 40 skills. Treat the number as a
          prompt to reread your resume, not a verdict.
        </p>
        <a className="code" href="https://github.com/Aditya-Anand-create/fitcheck">Read the code</a>

        {history.length > 0 && (
          <div className="history">
            <h3>Earlier checks</h3>
            <ul>
              {history.map((h) => (
                <li key={h.id}>
                  <button type="button" onClick={() => open(h.id)}>{h.title}</button>
                  <span>{h.score ?? '--'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <main>
        <form onSubmit={submit}>
          <label className="line">
            <span>Role</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Junior developer at Acme" />
          </label>
          <label>
            <span>Job post</span>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={9} placeholder="Paste the whole thing, including the requirements list" required />
          </label>
          <label>
            <span>Your resume</span>
            <textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={9} placeholder="Paste it, or upload a PDF below" required />
          </label>
          <p className="upload">
            <label className="file">
              Upload a PDF instead
              <input type="file" accept="application/pdf,.pdf" onChange={pickPdf} />
            </label>
            {fileName && <span> Read {fileName}. Check the text above, edit anything that came out odd.</span>}
          </p>
          <div className="actions">
            <button type="submit" disabled={busy}>{busy ? 'Reading...' : 'Compare'}</button>
            <button type="button" className="plain" onClick={() => setJd(SAMPLE_JD)}>fill in a sample job</button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>

        {result && <Result r={result} />}
      </main>
    </div>
  );
}
