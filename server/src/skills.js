// A small, hand-written skill taxonomy. Each entry: canonical name, category, aliases.
// Matching is plain text matching, so every result can be explained line by line.
const RAW = [
  ['JavaScript', 'Language', ['javascript', 'js', 'es6', 'ecmascript']],
  ['TypeScript', 'Language', ['typescript', 'ts']],
  ['Java', 'Language', ['java']],
  ['Python', 'Language', ['python']],
  ['C++', 'Language', ['c++', 'cpp']],
  ['C#', 'Language', ['c#', 'csharp']],
  ['Go', 'Language', ['golang']],
  ['SQL', 'Data', ['sql', 'postgresql', 'postgres', 'mysql', 'sqlite']],
  ['MongoDB', 'Data', ['mongodb', 'mongo', 'mongoose']],
  ['Redis', 'Data', ['redis']],
  ['React', 'Frontend', ['react', 'reactjs', 'react.js']],
  ['Next.js', 'Frontend', ['next.js', 'nextjs']],
  ['Angular', 'Frontend', ['angular']],
  ['Vue', 'Frontend', ['vue', 'vue.js', 'vuejs']],
  ['HTML/CSS', 'Frontend', ['html', 'css', 'html5', 'css3', 'sass', 'tailwind']],
  ['Node.js', 'Backend', ['node.js', 'nodejs', 'node']],
  ['Express', 'Backend', ['express', 'express.js', 'expressjs']],
  ['Spring Boot', 'Backend', ['spring boot', 'springboot', 'spring']],
  ['Django', 'Backend', ['django']],
  ['Flask', 'Backend', ['flask']],
  ['FastAPI', 'Backend', ['fastapi']],
  ['REST APIs', 'Backend', ['rest', 'restful', 'rest api', 'rest apis', 'api', 'apis']],
  ['GraphQL', 'Backend', ['graphql']],
  ['JDBC', 'Backend', ['jdbc']],
  ['Git', 'Tools', ['git', 'github', 'gitlab', 'version control']],
  ['Docker', 'DevOps', ['docker', 'containers', 'containerization']],
  ['Kubernetes', 'DevOps', ['kubernetes', 'k8s']],
  ['CI/CD', 'DevOps', ['ci/cd', 'cicd', 'jenkins', 'github actions']],
  ['AWS', 'Cloud', ['aws', 'amazon web services', 'ec2', 's3', 'lambda']],
  ['Azure', 'Cloud', ['azure']],
  ['GCP', 'Cloud', ['gcp', 'google cloud']],
  ['Linux', 'Tools', ['linux', 'unix', 'bash', 'shell']],
  ['Data Structures & Algorithms', 'CS Fundamentals', ['data structures', 'algorithms', 'dsa']],
  ['OOP', 'CS Fundamentals', ['oop', 'object oriented', 'object-oriented']],
  ['System Design', 'CS Fundamentals', ['system design', 'distributed systems', 'microservices']],
  ['Operating Systems', 'CS Fundamentals', ['operating systems', 'os concepts']],
  ['Machine Learning', 'AI/ML', ['machine learning', 'ml', 'scikit-learn', 'sklearn']],
  ['Deep Learning', 'AI/ML', ['deep learning', 'neural networks', 'pytorch', 'tensorflow']],
  ['LLMs / GenAI', 'AI/ML', ['llm', 'llms', 'generative ai', 'genai', 'openai', 'prompt engineering', 'rag']],
  ['Testing', 'Practices', ['testing', 'tests', 'unit testing', 'jest', 'junit', 'pytest', 'tdd', 'playwright', 'cypress']],
  ['Agile', 'Practices', ['agile', 'scrum']],
  ['Communication', 'Soft skills', ['communication', 'teamwork', 'collaboration']],
];

const ALIAS_INDEX = [];
for (const [name, category, aliases] of RAW) {
  for (const a of aliases) ALIAS_INDEX.push({ name, category, alias: a });
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

// Whole-word match that also works for tokens like "c++" and "node.js".
function hasTerm(text, term) {
  const re = new RegExp(`(^|[^a-z0-9+#.])${escapeRe(term)}(?![a-z0-9+#])`, 'i');
  return re.test(text);
}

function extractSkills(text) {
  const found = new Map();
  for (const { name, category, alias } of ALIAS_INDEX) {
    if (hasTerm(text, alias)) {
      const entry = found.get(name) || { name, category, matchedAs: [] };
      entry.matchedAs.push(alias);
      found.set(name, entry);
    }
  }
  return found;
}

module.exports = { extractSkills, hasTerm, SKILL_COUNT: RAW.length };
