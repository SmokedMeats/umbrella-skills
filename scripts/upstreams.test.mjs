import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { ROUTED_UPSTREAM_SKILLS, UPSTREAMS, layoutUpstream, newestSemverTag } from './upstreams.mjs';

const byName = (name) => UPSTREAMS.find((u) => u.name === name);

function write(file, text) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function tmp() {
  return mkdtempSync(path.join(tmpdir(), 'upstreams-test-'));
}

test('every upstream the overlay calls by name is listed', () => {
  const skills = UPSTREAMS.flatMap((u) => u.skills || []);
  for (const name of ['statechart', 'no-comments', 'deslop']) assert.ok(skills.includes(name), name);
  assert.ok(byName('mattpocock-skills'));
  assert.ok(byName('simple-english'));
});

test("Matt's pack is laid out from plugin.json, one folder per skill", () => {
  const dir = tmp();
  try {
    const src = path.join(dir, 'src');
    write(path.join(src, '.claude-plugin', 'plugin.json'), JSON.stringify({ skills: ['./skills/engineering/tdd', './skills/planning/to-spec'] }));
    write(path.join(src, 'skills', 'engineering', 'tdd', 'SKILL.md'), 'tdd\n');
    write(path.join(src, 'skills', 'planning', 'to-spec', 'SKILL.md'), 'to-spec\n');
    write(path.join(src, 'skills', 'unlisted', 'SKILL.md'), 'not shipped\n');
    write(path.join(src, 'LICENSE'), 'MIT\n');
    const out = path.join(dir, 'out');
    layoutUpstream(byName('mattpocock-skills'), src, out);
    assert.equal(readFileSync(path.join(out, 'skills', 'tdd', 'SKILL.md'), 'utf8'), 'tdd\n');
    assert.equal(readFileSync(path.join(out, 'skills', 'to-spec', 'SKILL.md'), 'utf8'), 'to-spec\n');
    assert.equal(existsSync(path.join(out, 'skills', 'unlisted')), false);
    assert.ok(existsSync(path.join(out, 'plugin.json')));
    assert.ok(existsSync(path.join(out, 'LICENSE')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('plugin-folder skills copy only the named skills and drop omitted paths', () => {
  const dir = tmp();
  try {
    const src = path.join(dir, 'src');
    write(path.join(src, 'pstack', 'skills', 'statechart', 'SKILL.md'), 'sc\n');
    write(path.join(src, 'pstack', 'skills', 'statechart', 'scripts', 'test', 'big.txt'), 'x\n');
    write(path.join(src, 'pstack', 'skills', 'no-comments', 'SKILL.md'), 'nc\n');
    write(path.join(src, 'pstack', 'skills', 'poteto-mode', 'SKILL.md'), 'not ours\n');
    write(path.join(src, 'pstack', 'LICENSE'), 'MIT\n');
    const out = path.join(dir, 'out');
    layoutUpstream(byName('pstack-skills'), src, out);
    assert.ok(existsSync(path.join(out, 'skills', 'statechart', 'SKILL.md')));
    assert.equal(existsSync(path.join(out, 'skills', 'statechart', 'scripts', 'test')), false);
    assert.ok(existsSync(path.join(out, 'skills', 'no-comments', 'SKILL.md')));
    assert.equal(existsSync(path.join(out, 'skills', 'poteto-mode')), false);
    assert.ok(existsSync(path.join(out, 'LICENSE')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a named skill the upstream stopped shipping fails loudly', () => {
  const dir = tmp();
  try {
    const src = path.join(dir, 'src');
    write(path.join(src, 'cursor-team-kit', 'LICENSE'), 'MIT\n');
    assert.throws(() => layoutUpstream(byName('cursor-team-kit-skills'), src, path.join(dir, 'out')), /no longer ships deslop/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('newestSemverTag picks the highest plain semver tag', () => {
  assert.equal(newestSemverTag(['v1.2.0', 'v1.10.0', 'v1.3.2', 'v2.0.0-rc1', 'latest', undefined]), 'v1.10.0');
  assert.equal(newestSemverTag(['nightly']), null);
});

test('every routed skill comes from a listed upstream source', () => {
  for (const name of ['statechart', 'no-comments', 'deslop']) assert.ok(ROUTED_UPSTREAM_SKILLS.includes(name), name);
});
