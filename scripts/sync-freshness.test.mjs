import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkFreshness, freshnessDecision } from './sync-freshness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('freshnessDecision: equal checkout may sync', () => {
  assert.deepEqual(freshnessDecision({ git: true, fetchOk: true, upstream: 'origin/main', ahead: 0, behind: 0 }), { ok: true, state: 'equal' });
});

test('freshnessDecision: ahead only (unpushed commits) may sync', () => {
  assert.deepEqual(freshnessDecision({ git: true, fetchOk: true, upstream: 'origin/main', ahead: 2, behind: 0 }), { ok: true, state: 'ahead' });
});

test('freshnessDecision: behind refuses', () => {
  assert.deepEqual(freshnessDecision({ git: true, fetchOk: true, upstream: 'origin/main', ahead: 0, behind: 3 }), { ok: false, state: 'behind' });
});

test('freshnessDecision: diverged refuses', () => {
  assert.deepEqual(freshnessDecision({ git: true, fetchOk: true, upstream: 'origin/main', ahead: 1, behind: 1 }), { ok: false, state: 'diverged' });
});

test('freshnessDecision: failed fetch refuses', () => {
  assert.deepEqual(freshnessDecision({ git: true, fetchOk: false }), { ok: false, state: 'fetch-failed' });
});

test('freshnessDecision: no upstream branch refuses', () => {
  assert.deepEqual(freshnessDecision({ git: true, fetchOk: true, upstream: null }), { ok: false, state: 'no-upstream' });
});

test('freshnessDecision: a folder that is not a git checkout is skipped', () => {
  assert.deepEqual(freshnessDecision({ git: false }), { ok: true, state: 'not-git' });
});

test('checkFreshness refuses and names the repo when git fetch fails', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'sync-fresh-fetch-'));
  try {
    const dir = path.join(sandbox, 'Offline');
    mkdirSync(path.join(dir, '.git'), { recursive: true });
    const calls = [];
    const spawn = (cmd, args) => {
      calls.push(args.slice(2).join(' '));
      return { status: 128, stdout: '', stderr: 'fatal: unable to access remote\n' };
    };
    const errors = [];
    const ok = checkFreshness([{ name: 'Offline', dir }], spawn, () => {}, (line) => errors.push(line));
    assert.equal(ok, false);
    assert.deepEqual(calls, ['fetch --quiet']);
    assert.match(errors[0], /sync: refuse: Offline: git fetch failed \(fatal: unable to access remote\)/);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

function git(args, cwd) {
  const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args], { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return r.stdout;
}

// A scratch origin holding a copy of this pack (no .git, no vendor), and a local clone of it.
function packOriginAndClone(sandbox, extraFiles = {}) {
  const origin = path.join(sandbox, 'origin-pack');
  const ws = path.join(sandbox, 'ws');
  const pack = path.join(ws, 'pack');
  cpSync(root, origin, {
    recursive: true,
    filter: (src) => {
      const parts = path.relative(root, src).split(path.sep);
      return !parts.includes('.git') && parts[0] !== 'vendor' && parts[0] !== 'updates';
    },
  });
  for (const [rel, text] of Object.entries(extraFiles)) writeFileSync(path.join(origin, rel), text);
  git(['init', '-q', '-b', 'main'], origin);
  git(['add', '-A'], origin);
  git(['commit', '-q', '-m', 'seed'], origin);
  mkdirSync(ws, { recursive: true });
  git(['clone', '-q', '--local', origin, pack], sandbox);
  return { origin, ws, pack };
}

function advance(repo, file = 'ADVANCED.md') {
  writeFileSync(path.join(repo, file), `advanced ${Date.now()}\n`);
  git(['add', file], repo);
  git(['commit', '-q', '-m', 'advance origin'], repo);
}

function runSync(pack, home) {
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  for (const k of ['UMBRELLA_SWARM', 'UMBRELLA_OVERLAY', 'UMBRELLA_FIXTURE_WORKSPACE', 'UMBRELLA_BOX_SKILLS_ROOT', 'NODE_TEST_CONTEXT']) delete env[k];
  const r = spawnSync(process.execPath, ['scripts/sync-workspace.mjs'], { cwd: pack, env, encoding: 'utf8' });
  return { status: r.status, text: `${r.stdout}${r.stderr}` };
}

test('sync refuses a pack checkout that is behind its origin and copies nothing', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'sync-fresh-pack-'));
  try {
    const { origin, pack } = packOriginAndClone(sandbox);
    const home = path.join(sandbox, 'home');
    mkdirSync(home);
    advance(origin);
    const run = runSync(pack, home);
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.text, /sync: refuse: pack is 1 behind origin\/main/);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('sync refuses a skill_targets repo that is behind its origin and copies nothing', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'sync-fresh-target-'));
  try {
    const projectYml = 'workspace:\n  skill_targets:\n    - { name: Prod, dirs: [.cursor/skills] }\n';
    const { ws, pack } = packOriginAndClone(sandbox, { 'project.yml': projectYml });
    const prodOrigin = path.join(sandbox, 'origin-prod');
    mkdirSync(prodOrigin);
    git(['init', '-q', '-b', 'Development'], prodOrigin);
    writeFileSync(path.join(prodOrigin, 'README.md'), 'prod\n');
    git(['add', '-A'], prodOrigin);
    git(['commit', '-q', '-m', 'seed'], prodOrigin);
    const prod = path.join(ws, 'Prod');
    git(['clone', '-q', '--local', prodOrigin, prod], sandbox);
    advance(prodOrigin);
    const home = path.join(sandbox, 'home');
    mkdirSync(home);
    const run = runSync(pack, home);
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.text, /fresh: pack: up to date with origin\/main/);
    assert.match(run.text, /sync: refuse: Prod is 1 behind origin\/Development/);
    assert.equal(existsSync(path.join(prod, '.cursor', 'skills')), false);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('sync goes ahead when the pack is only ahead of its origin', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'sync-fresh-ahead-'));
  try {
    const { pack } = packOriginAndClone(sandbox);
    advance(pack, 'LOCAL.md');
    const home = path.join(sandbox, 'home');
    mkdirSync(home);
    const run = runSync(pack, home);
    assert.equal(run.status, 0, run.text);
    assert.match(run.text, /fresh: pack: 1 ahead of origin\/main/);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills', 'implement', 'SKILL.md')), true);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
