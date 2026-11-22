import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSkillTargets, rowAllows } from './skill-targets.mjs';

const raw = `workspace:
  skill_targets:
    - { name: Main, dirs: [.grok/skills, .claude/skills], own: [.grok/skills, .agents/skills], rules: "node scripts/r.mjs" }
    - { name: Site, dirs: [.claude/skills], skip: [gh-mix, play-quality] }
    - { name: Watch, dirs: [.grok/skills, .claude/skills, .cursor/skills], own: [.grok/skills], only: [implement, tdd, wear-compose-m3], skip: [tdd] }

swarm:
  areas_file: areas.yml
`;

test('parseSkillTargets: reads every field, and only is null when absent', () => {
  const [main, site, watch] = parseSkillTargets(raw);
  assert.deepEqual(main, {
    repo: 'Main', dirs: ['.grok/skills', '.claude/skills'], own: ['.grok/skills', '.agents/skills'],
    rules: 'node scripts/r.mjs', skip: [], only: null,
  });
  assert.deepEqual(site.skip, ['gh-mix', 'play-quality']);
  assert.equal(site.only, null);
  assert.deepEqual(watch.only, ['implement', 'tdd', 'wear-compose-m3']);
  assert.deepEqual(watch.own, ['.grok/skills']);
});

test('parseSkillTargets: no block gives no rows', () => {
  assert.deepEqual(parseSkillTargets('workspace:\n  overlay_pack: x\n'), []);
});

test('parseSkillTargets: an empty only list allows nothing', () => {
  const [row] = parseSkillTargets('skill_targets:\n  - { name: A, dirs: [.claude/skills], only: [] }\n');
  assert.deepEqual(row.only, []);
  assert.equal(rowAllows(row, 'implement'), false);
});

test('rowAllows: no only list allows everything except skip', () => {
  const [, site] = parseSkillTargets(raw);
  assert.equal(rowAllows(site, 'implement'), true);
  assert.equal(rowAllows(site, 'gh-mix'), false);
});

test('rowAllows: only is an allow list, and skip still wins', () => {
  const [, , watch] = parseSkillTargets(raw);
  assert.equal(rowAllows(watch, 'implement'), true);
  assert.equal(rowAllows(watch, 'wear-compose-m3'), true);
  assert.equal(rowAllows(watch, 'grill-me'), false);
  assert.equal(rowAllows(watch, 'tdd'), false);
});
