import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;

function runReady(cwd, args, extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  delete env.PUBLIC_SAFE_DENYLIST;
  const run = spawnSync(node, [path.join(cwd, 'scripts/check-readiness.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
    env,
  });
  return { status: run.status === null || run.status === undefined ? 1 : run.status, text: `${run.stdout || ''}${run.stderr || ''}` };
}

function results(text) {
  const map = new Map();
  for (const line of text.split('\n')) {
    const match = line.match(/^(PASS|FAIL|NOT APPLICABLE|NOT RUN|N\/A|EXTERNAL) (.+?) — (.*)$/);
    if (match) map.set(match[2], { result: match[1], detail: match[3] });
  }
  return map;
}

function exportFixture() {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-ready-export-'));
  const tree = path.join(sandbox, 'tree');
  cpSync(root, tree, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(root, src);
      if (!rel) return true;
      const parts = rel.split(path.sep);
      if (parts.includes('.git') || parts[0] === 'vendor') return false;
      if (rel === path.join('skills', 'umbrella', 'private-bindings.md')) return false;
      return true;
    },
  });
  const git = (args) => {
    const run = spawnSync('git', args, { cwd: tree, encoding: 'utf8' });
    if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  };
  git(['init', '-b', 'main']);
  git(['config', 'user.email', 'readiness@local']);
  git(['config', 'user.name', 'readiness']);
  git(['add', '-A']);
  git(['commit', '-m', 'public archive candidate']);
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  return { sandbox, tree };
}

test('an unknown readiness argument is rejected', () => {
  const run = runReady(root, ['--export']);
  assert.equal(run.status, 2);
  assert.match(run.text, /Unknown argument: --export/);
});

test('public readiness on the source pack fails closed', () => {
  const run = runReady(root, ['--public']);
  const rows = results(run.text);
  assert.equal(run.status, 1, run.text);
  assert.equal(rows.get('check-shared-flow').result, 'NOT APPLICABLE');
  assert.equal(rows.get('check-shared-flow.test').result, 'NOT APPLICABLE');
  assert.equal(rows.get('install-fixture').result, 'NOT APPLICABLE');
  assert.equal(rows.get('check-shared-flow-public').result, 'FAIL');
  assert.equal(rows.get('install-fixture-public').result, 'FAIL');
  assert.match(run.text, /MECHANICAL FAIL/);
  assert.equal(run.text.includes('MECHANICAL PASS'), false);
  assert.equal(run.text.includes('denylist 0'), false);
});

test('public readiness on an export runs the public checks and does not pass the source rows', () => {
  const { sandbox, tree } = exportFixture();
  try {
    const run = runReady(tree, ['--public']);
    const rows = results(run.text);
    assert.equal(run.status, 0, run.text);
    assert.equal(rows.get('check-steps').result, 'PASS');
    assert.equal(rows.get('check-shared-flow').result, 'NOT APPLICABLE');
    assert.equal(rows.get('check-shared-flow-public').result, 'PASS');
    assert.equal(rows.get('check-shared-flow.test').result, 'NOT APPLICABLE');
    assert.match(rows.get('check-shared-flow.test').detail, /not a public pass/);
    assert.equal(rows.get('install-fixture').result, 'NOT APPLICABLE');
    assert.equal(rows.get('install-fixture-public').result, 'PASS');
    assert.match(rows.get('install-fixture-public').detail, /binding omitted/);
    assert.equal(rows.get('public-archive').result, 'PASS');
    assert.equal(rows.get('check-public-safe').result, 'NOT RUN');
    assert.match(rows.get('check-public-safe').detail, /not a pass/);
    assert.equal(rows.get('commands.pr_ready').result, 'N/A');
    assert.match(run.text, /MECHANICAL PASS/);
    assert.match(run.text, /source-only rows are NOT APPLICABLE and are not a pass/);
    assert.match(run.text, /FULL SUITE NOT A PASS/);
    assert.equal(run.text.includes('FAIL\tcheck-shared-flow.test'), false);
    assert.equal(run.text.includes('denylist 0'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('default readiness on an export still fails closed', () => {
  const { sandbox, tree } = exportFixture();
  try {
    const run = runReady(tree, []);
    const rows = results(run.text);
    assert.equal(run.status, 1, run.text);
    assert.equal(rows.get('check-shared-flow').result, 'FAIL', run.text);
    assert.equal(rows.get('check-shared-flow.test').result, 'FAIL');
    assert.equal(rows.get('install-fixture').result, 'FAIL');
    assert.match(run.text, /required binding missing; fail closed/);
    assert.match(run.text, /MECHANICAL FAIL/);
    assert.equal(rows.get('check-public-safe').result, 'NOT RUN');
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('default source readiness still passes its source rows without a denylist', () => {
  const run = runReady(root, []);
  const rows = results(run.text);
  assert.equal(run.status, 0, run.text);
  assert.equal(rows.get('check-steps').result, 'PASS');
  assert.equal(rows.get('check-shared-flow').result, 'PASS');
  assert.equal(rows.get('check-shared-flow-public').result, 'NOT APPLICABLE');
  assert.equal(rows.get('check-shared-flow.test').result, 'PASS');
  assert.equal(rows.get('install-fixture').result, 'PASS');
  assert.equal(rows.get('install-fixture-public').result, 'NOT APPLICABLE');
  assert.equal(rows.get('public-archive').result, 'PASS');
  assert.equal(rows.get('check-public-safe').result, 'NOT RUN');
  assert.match(rows.get('check-public-safe').detail, /not a pass/);
  assert.match(run.text, /MECHANICAL PASS/);
  assert.equal(run.text.includes('denylist 0'), false);
  assert.equal(run.text.includes('FULL SUITE NOT A PASS'), false);
});
