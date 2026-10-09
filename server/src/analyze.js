const { extractSkills } = require('./skills');

const MUST_HINTS = /(required|requirements?|must|minimum|you have|you will need|qualifications|proficien|strong)/i;
const NICE_HINTS = /(nice to have|preferred|bonus|plus|good to have|desirable|familiarity)/i;

// Split the JD into lines and mark each skill as "required" or "nice to have"
// depending on the nearest heading/keyword. Default is required.
function classifyJdSkills(jd) {
  const lines = jd.split(/\r?\n/);
  let mode = 'required';
  const level = new Map();
  for (const line of lines) {
    if (NICE_HINTS.test(line) && line.length < 80) mode = 'nice';
    else if (MUST_HINTS.test(line) && line.length < 60) mode = 'required';
    const inline = NICE_HINTS.test(line) ? 'nice' : mode;
    for (const [name] of extractSkills(line)) {
      // a skill seen once as required stays required
      if (level.get(name) !== 'required') level.set(name, inline);
    }
  }
  return level;
}

function analyze(resume, jd) {
  const resumeSkills = extractSkills(resume);
  const jdSkills = extractSkills(jd);
  const level = classifyJdSkills(jd);

  const REQUIRED_W = 2;
  const NICE_W = 1;
  let total = 0;
  let got = 0;
  const matched = [];
  const missing = [];
  for (const [name, info] of jdSkills) {
    const lvl = level.get(name) || 'required';
    const w = lvl === 'required' ? REQUIRED_W : NICE_W;
    total += w;
    const row = { name, category: info.category, level: lvl };
    if (resumeSkills.has(name)) {
      got += w;
      matched.push(row);
    } else {
      missing.push(row);
    }
  }
  const extra = [...resumeSkills.values()]
    .filter((s) => !jdSkills.has(s.name))
    .map((s) => ({ name: s.name, category: s.category }));

  const score = total === 0 ? null : Math.round((got / total) * 100);
  const sortLvl = (a, b) => (a.level === b.level ? a.name.localeCompare(b.name) : a.level === 'required' ? -1 : 1);
  matched.sort(sortLvl);
  missing.sort(sortLvl);

  const tips = [];
  const missReq = missing.filter((m) => m.level === 'required');
  if (total === 0) tips.push('No known skills were found in the job description. Paste the full text, including the requirements section.');
  for (const m of missReq.slice(0, 5)) {
    tips.push(`The job asks for ${m.name}. If you have really used it, add it to a project or skills line. If not, it is a learning gap, not a wording gap.`);
  }
  if (!/\d/.test(resume)) tips.push('Your resume has no numbers. Add measurable facts such as test counts, users, or response times, but only real ones.');
  if (resume.trim().split(/\s+/).length < 120) tips.push('The resume text is short. Make sure you pasted the whole thing.');

  return {
    score,
    verdict: score === null ? 'Not enough data' : score >= 75 ? 'Strong fit' : score >= 50 ? 'Partial fit' : 'Weak fit',
    matched,
    missing,
    extra,
    tips,
    counts: { jdSkills: jdSkills.size, resumeSkills: resumeSkills.size },
  };
}

module.exports = { analyze };
