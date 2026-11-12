import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const scriptName = 'check-pr-ready.mjs';

function git(cwd, args) {
  const run = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  return (run.stdout || '').trim();
}

function runGate(cwd, extraEnv = {}, { keepDenylist = false } = {}) {
  const env = { ...process.env, ...extraEnv };
  if (!keepDenylist) delete env.PUBLIC_SAFE_DENYLIST;
  if (extraEnv.PUBLIC_SAFE_DENYLIST) env.PUBLIC_SAFE_DENYLIST = extraEnv.PUBLIC_SAFE_DENYLIST;
  const run = spawnSync(node, [path.join(cwd, 'scripts', scriptName)], {
    cwd,
    encoding: 'utf8',
    env,
  });
  const text = `${run.stdout || ''}${run.stderr || ''}`;
  return {
    status: run.status === null || run.status === undefined ? 1 : run.status,
    text,
    last: text.trim().split('\n').filter(Boolean).pop() || '',
  };
}

function copyPack() {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'pr-ready-pack-'));
  const tree = path.join(sandbox, 'tree');
  cpSync(root, tree, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(root, src);
      if (!rel) return true;
      return !rel.split(path.sep).includes('.git');
    },
  });
  git(tree, ['init', '-b', 'main']);
  git(tree, ['config', 'user.email', 'pr-ready@local']);
  git(tree, ['config', 'user.name', 'pr-ready']);
  git(tree, ['add', '-A']);
  git(tree, ['commit', '-m', 'pack']);
  git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  return { sandbox, tree };
}

function writeDenylist(sandbox, body) {
  const file = path.join(sandbox, 'denylist.txt');
  writeFileSync(file, body);
  return file;
}

// The product name is a denylist hit in the private binding. Keep it out of
// this file so the exported tree does not contain the pattern.
const privateToken = ['Xyber', 'Run'].join('');

test('a pack with a clean export and an empty range passes', () => {
  const { sandbox, tree } = copyPack();
  try {
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    const sha = git(tree, ['rev-parse', 'HEAD']);
    assert.equal(run.status, 0, run.text);
    assert.match(run.text, /generated copies: none; skipped/);
    assert.equal(run.last, `pr-ready: PASS ${sha}`);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a denylist hit on an exported file fails public-safe', () => {
  const { sandbox, tree } = copyPack();
  try {
    const token = 'LEAK_TOKEN_pr_ready_9f3a';
    writeFileSync(path.join(tree, 'leak.txt'), `${token}\n`);
    git(tree, ['add', 'leak.txt']);
    git(tree, ['commit', '-m', 'add leak']);
    const parent = git(tree, ['rev-parse', 'HEAD~1']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', parent]);
    const denylist = writeDenylist(sandbox, `${token}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.last, /^pr-ready: FAIL /);
    assert.match(run.last, /public-safe/);
    assert.match(run.last, /denylist [1-9]/);
    assert.equal(run.last.includes('pr-ready: PASS'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a broken phase skill fails the structural check', () => {
  const { sandbox, tree } = copyPack();
  try {
    const skill = path.join(tree, 'skills', 'implement', 'SKILL.md');
    writeFileSync(skill, readFileSync(skill, 'utf8').replace('## Steps\n', '## Step list\n'));
    git(tree, ['add', 'skills/implement/SKILL.md']);
    git(tree, ['commit', '-m', 'break steps']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.last, /^pr-ready: FAIL /);
    assert.match(run.last, /check-steps:/);
    assert.match(run.last, /no `## Steps` section/);
    assert.equal(run.last.includes('public-safe'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a missing denylist fails closed', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'pr-ready-deny-'));
  const tree = path.join(sandbox, 'tree');
  try {
    mkdirSync(path.join(tree, 'scripts'), { recursive: true });
    cpSync(path.join(root, 'scripts', scriptName), path.join(tree, 'scripts', scriptName));
    const listed = path.join(sandbox, 'denylist.txt');
    writeFileSync(listed, `${privateToken}\n`);
    git(tree, ['init', '-b', 'main']);
    git(tree, ['config', 'user.email', 'pr-ready@local']);
    git(tree, ['config', 'user.name', 'pr-ready']);
    git(tree, ['config', 'publicsafe.denylist', listed]);
    writeFileSync(path.join(tree, 'README.md'), 'hello\n');
    git(tree, ['add', '-A']);
    git(tree, ['commit', '-m', 'tiny']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);

    const unset = runGate(tree, {});
    assert.equal(unset.status, 1, unset.text);
    assert.equal(unset.last, 'pr-ready: FAIL PUBLIC_SAFE_DENYLIST is unset');
    assert.equal(unset.text.includes('check:public-safe PASS'), false);

    const missing = runGate(tree, { PUBLIC_SAFE_DENYLIST: path.join(sandbox, 'no-such-denylist.txt') });
    assert.equal(missing.status, 1, missing.text);
    assert.match(missing.last, /^pr-ready: FAIL PUBLIC_SAFE_DENYLIST is missing /);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a dirty working tree fails before PASS can name HEAD', () => {
  const { sandbox, tree } = copyPack();
  try {
    writeFileSync(path.join(tree, 'untracked.txt'), 'not committed\n');
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    assert.notEqual(run.status, 0, run.text);
    assert.equal(run.last, 'pr-ready: FAIL working tree or index is dirty');
    assert.equal(run.last.includes('pr-ready: PASS'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a dirty index fails', () => {
  const { sandbox, tree } = copyPack();
  try {
    writeFileSync(path.join(tree, 'staged.txt'), 'staged only\n');
    git(tree, ['add', 'staged.txt']);
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    assert.notEqual(run.status, 0, run.text);
    assert.equal(run.last, 'pr-ready: FAIL working tree or index is dirty');
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a worktree fix of a broken HEAD fails instead of passing that SHA', () => {
  const { sandbox, tree } = copyPack();
  try {
    const skill = path.join(tree, 'skills', 'implement', 'SKILL.md');
    const good = readFileSync(skill, 'utf8');
    writeFileSync(skill, good.replace('## Steps\n', '## Step list\n'));
    git(tree, ['add', 'skills/implement/SKILL.md']);
    git(tree, ['commit', '-m', 'break steps']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    writeFileSync(skill, good);
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    const sha = git(tree, ['rev-parse', 'HEAD']);
    assert.notEqual(run.status, 0, run.text);
    assert.equal(run.last, 'pr-ready: FAIL working tree or index is dirty');
    assert.equal(run.text.includes(`pr-ready: PASS ${sha}`), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a branch behind origin/main fails', () => {
  const { sandbox, tree } = copyPack();
  try {
    writeFileSync(path.join(tree, 'later.txt'), 'on main only\n');
    git(tree, ['add', 'later.txt']);
    git(tree, ['commit', '-m', 'main moves']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    git(tree, ['reset', '--hard', 'HEAD~1']);
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    assert.notEqual(run.status, 0, run.text);
    assert.equal(run.last, 'pr-ready: FAIL origin/main is not an ancestor of HEAD');
    assert.equal(run.text.includes('pr-ready: PASS'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a crashing gitleaks fails the gate', () => {
  const { sandbox, tree } = copyPack();
  const bin = mkdtempSync(path.join(tmpdir(), 'pr-ready-gitleaks-'));
  try {
    const token = `ghp_${'A'.repeat(36)}`;
    writeFileSync(path.join(tree, 'secret.txt'), `${token}\n`);
    git(tree, ['add', 'secret.txt']);
    git(tree, ['commit', '-m', 'add token']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    const standin = path.join(bin, 'gitleaks');
    writeFileSync(
      standin,
      `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'version') process.exit(0);
process.exit(1);
`,
    );
    chmodSync(standin, 0o755);
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, {
      PUBLIC_SAFE_DENYLIST: denylist,
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    });
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.last, /^pr-ready: FAIL /);
    assert.match(run.last, /gitleaks error \(fail closed\): gitleaks wrote no report/);
    assert.equal(run.last.includes('pr-ready: PASS'), false);
    assert.equal(run.text.includes('gitleaks 0'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
    rmSync(bin, { recursive: true, force: true });
  }
});

const PUBLIC_FLOW_LINE = 'check-shared-flow: public mode; binding export-ignore and absent; skipped binding presence and content checks';

function initArchiveRepo(tree, dest) {
  mkdirSync(dest);
  const archive = spawnSync('git', ['archive', '--format=tar', 'HEAD'], { cwd: tree, maxBuffer: 1 << 28 });
  if (archive.status !== 0) throw new Error(archive.stderr?.toString() || 'git archive failed');
  const extract = spawnSync('tar', ['-x', '-C', dest], { input: archive.stdout });
  if (extract.status !== 0) throw new Error(extract.stderr?.toString() || 'tar extract failed');
  git(dest, ['init', '-b', 'main']);
  git(dest, ['config', 'user.email', 'pr-ready@local']);
  git(dest, ['config', 'user.name', 'pr-ready']);
  git(dest, ['add', '-A']);
  git(dest, ['commit', '-m', 'public snapshot']);
  git(dest, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
}

test('a public snapshot omits the export-ignored binding and passes in public mode', () => {
  const { sandbox, tree } = copyPack();
  const exported = path.join(sandbox, 'export');
  try {
    initArchiveRepo(tree, exported);
    assert.equal(existsSync(path.join(exported, 'skills', 'umbrella', 'private-bindings.md')), false);
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(exported, { PUBLIC_SAFE_DENYLIST: denylist });
    const sha = git(exported, ['rev-parse', 'HEAD']);
    assert.equal(run.status, 0, run.text);
    assert.equal(run.text.includes(PUBLIC_FLOW_LINE), true, run.text);
    assert.equal(run.last, `pr-ready: PASS ${sha}`);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a private layout with the tracked binding deleted still fails closed', () => {
  const { sandbox, tree } = copyPack();
  try {
    git(tree, ['rm', '-f', 'skills/umbrella/private-bindings.md']);
    git(tree, ['commit', '-m', 'delete binding']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.last, /^pr-ready: FAIL /);
    assert.match(run.last, /required binding missing; fail closed/);
    assert.equal(run.text.includes(PUBLIC_FLOW_LINE), false);
    assert.equal(run.last.includes('pr-ready: PASS'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a tracked binding with broken contents still fails closed', () => {
  const { sandbox, tree } = copyPack();
  try {
    writeFileSync(path.join(tree, 'skills', 'umbrella', 'private-bindings.md'), 'broken binding text\n');
    git(tree, ['add', 'skills/umbrella/private-bindings.md']);
    git(tree, ['commit', '-m', 'break binding']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    const denylist = writeDenylist(sandbox, `${privateToken}\n`);
    const run = runGate(tree, { PUBLIC_SAFE_DENYLIST: denylist });
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.last, /^pr-ready: FAIL /);
    assert.match(run.last, /private bindings:/);
    assert.equal(run.text.includes(PUBLIC_FLOW_LINE), false);
    assert.equal(run.last.includes('pr-ready: PASS'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
