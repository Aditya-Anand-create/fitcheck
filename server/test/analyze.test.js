const test = require('node:test');
const assert = require('node:assert');
const { analyze } = require('../src/analyze');
const { hasTerm } = require('../src/skills');

const resume = 'Built a chat app with React, Node.js, Express and MongoDB. Wrote 5 tests. Used Git and GitHub. Java and SQL coursework, JDBC. ' + 'x '.repeat(120);

test('whole-word matching: "java" does not match "javascript"', () => {
  assert.equal(hasTerm('we use javascript', 'java'), false);
  assert.equal(hasTerm('we use java daily', 'java'), true);
  assert.equal(hasTerm('c++ and node.js', 'c++'), true);
});

test('full match scores 100', () => {
  const r = analyze(resume, 'Requirements: React, Node.js, MongoDB');
  assert.equal(r.score, 100);
  assert.equal(r.missing.length, 0);
});

test('missing required skill lowers score and is reported', () => {
  const r = analyze(resume, 'Requirements:\nReact\nKubernetes\nDocker');
  assert.ok(r.score < 50);
  assert.deepEqual(r.missing.map((m) => m.name).sort(), ['Docker', 'Kubernetes']);
  assert.ok(r.tips.some((t) => t.includes('Kubernetes')));
});

test('nice-to-have skills weigh less than required ones', () => {
  const jd = 'Requirements:\nReact\nNice to have:\nKubernetes';
  const r = analyze(resume, jd);
  assert.equal(r.score, 67); // 2 of 3 points
  assert.equal(r.missing[0].level, 'nice');
});

test('no known skills in the job post means no score', () => {
  const r = analyze(resume, 'We are a friendly company with free coffee and good vibes for everyone.');
  assert.equal(r.score, null);
});

test('"js" inside node.js does not count as JavaScript', () => {
  assert.equal(hasTerm('we use node.js', 'js'), false);
  assert.equal(hasTerm('we use js and ts', 'js'), true);
});
