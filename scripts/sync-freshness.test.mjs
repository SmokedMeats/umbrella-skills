import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { setSpawnSyncForTests, diffTrees } from './check-updates.mjs';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkFreshness, freshnessDecision, freshnessLine, gitEnv } from './sync-freshness.mjs';
import { tracksBinding } from './tracks-binding.mjs';

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

test('freshnessDecision: detached HEAD refuses with its own state', () => {
  const facts = { git: true, fetchOk: true, detached: true, head: 'abc1234' };
  const d = freshnessDecision(facts);
  assert.deepEqual(d, { ok: false, state: 'detached' });
  assert.match(freshnessLine('Prod', facts, d), /^sync: refuse: Prod: HEAD is detached at abc1234/);
});

test('freshnessDecision: an upstream that is gone on the remote refuses', () => {
  const facts = { git: true, fetchOk: true, branch: 'feat', upstream: null, upstreamConfigured: 'origin/feat' };
  const d = freshnessDecision(facts);
  assert.deepEqual(d, { ok: false, state: 'upstream-gone' });
  assert.match(freshnessLine('Prod', facts, d), /its upstream origin\/feat is gone on the remote/);
});

test('a never-pushed branch gets the git push -u origin HEAD hint', () => {
  const facts = { git: true, fetchOk: true, branch: 'feat', upstream: null, upstreamConfigured: null };
  const d = freshnessDecision(facts);
  assert.equal(d.state, 'no-upstream');
  assert.match(freshnessLine('Prod', facts, d), /Prod \(branch feat\) has no upstream branch \(never pushed\?\)\. Push it with git push -u origin HEAD/);
});

test('gitEnv strips every git location variable and turns prompts off', () => {
  const mustStrip = [
    'GIT_DIR',
    'GIT_WORK_TREE',
    'GIT_INDEX_FILE',
    'GIT_COMMON_DIR',
    'GIT_OBJECT_DIRECTORY',
    'GIT_ALTERNATE_OBJECT_DIRECTORIES',
    'GIT_NAMESPACE',
    'GIT_PREFIX',
  ];
  const dirty = { PATH: '/bin', GIT_CEILING_DIRECTORIES: '/ceil' };
  for (const key of mustStrip) dirty[key] = `/x/${key}`;
  const env = gitEnv(dirty);
  for (const key of mustStrip) assert.equal(key in env, false, key);
  assert.equal(env.GIT_TERMINAL_PROMPT, '0');
  assert.equal(env.PATH, '/bin');
  // Not a location redirect next to git -C and a present .git; left in place on purpose.
  assert.equal(env.GIT_CEILING_DIRECTORIES, '/ceil');
});

test('checkFreshness stops at the first failed fetch and names the repos it did not try', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'sync-fresh-fast-'));
  try {
    const repos = ['A', 'B', 'C'].map((name) => {
      const dir = path.join(sandbox, name);
      mkdirSync(path.join(dir, '.git'), { recursive: true });
      return { name, dir };
    });
    const fetched = [];
    const spawn = (cmd, args) => {
      fetched.push(args[1]);
      return { status: 128, stdout: '', stderr: 'fatal: Could not resolve host: github.com\n' };
    };
    const errors = [];
    assert.equal(checkFreshness(repos, spawn, () => {}, (l) => errors.push(l)), false);
    assert.deepEqual(fetched, [repos[0].dir]);
    assert.match(errors[0], /sync: refuse: A: git fetch failed/);
    assert.match(errors[1], /not tried: B, C\./);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
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
    assert.deepEqual(calls, ['fetch --quiet --prune']);
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

function runSync(pack, home, args = [], extraEnv = {}) {
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  for (const k of ['UMBRELLA_SWARM', 'UMBRELLA_OVERLAY', 'UMBRELLA_FIXTURE_WORKSPACE', 'UMBRELLA_BOX_SKILLS_ROOT', 'NODE_TEST_CONTEXT', 'GIT_DIR', 'GIT_WORK_TREE']) delete env[k];
  Object.assign(env, extraEnv);
  const r = spawnSync(process.execPath, ['scripts/sync-workspace.mjs', ...args], { cwd: pack, env, encoding: 'utf8' });
  return { status: r.status, text: `${r.stdout}${r.stderr}` };
}

function publicSyncArgs(pack) {
  return tracksBinding(pack) ? [] : ['--public'];
}

test('sync refuses a pack checkout that is behind its origin and copies nothing', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'sync-fresh-pack-'));
  try {
    const { origin, pack } = packOriginAndClone(sandbox);
    const home = path.join(sandbox, 'home');
    mkdirSync(home);
    advance(origin);
    const run = runSync(pack, home, publicSyncArgs(pack));
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
    const run = runSync(pack, home, publicSyncArgs(pack));
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
    const run = runSync(pack, home, publicSyncArgs(pack));
    assert.equal(run.status, 0, run.text);
    assert.match(run.text, /fresh: pack: 1 ahead of origin\/main/);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills', 'implement', 'SKILL.md')), true);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

function withPack(prefix, fn) {
  const sandbox = mkdtempSync(path.join(tmpdir(), prefix));
  try {
    const made = packOriginAndClone(sandbox);
    const home = path.join(sandbox, 'home');
    mkdirSync(home);
    fn({ ...made, sandbox, home });
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

test('sync refuses a branch whose upstream was deleted on the remote ([gone])', () => {
  withPack('sync-fresh-gone-', ({ origin, pack, home }) => {
    git(['switch', '-q', '-c', 'feat'], pack);
    git(['push', '-q', '-u', 'origin', 'feat'], pack);
    git(['branch', '-q', '-D', 'feat'], origin);
    const run = runSync(pack, home, publicSyncArgs(pack));
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.text, /sync: refuse: pack \(branch feat\): its upstream origin\/feat is gone on the remote/);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  });
});

test('sync refuses a never-pushed branch and prints the push hint', () => {
  withPack('sync-fresh-new-', ({ pack, home }) => {
    git(['switch', '-q', '-c', 'local-only'], pack);
    const run = runSync(pack, home, publicSyncArgs(pack));
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.text, /pack \(branch local-only\) has no upstream branch \(never pushed\?\)\. Push it with git push -u origin HEAD/);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  });
});

test('sync refuses a detached HEAD with its own message', () => {
  withPack('sync-fresh-detached-', ({ pack, home }) => {
    git(['switch', '-q', '--detach'], pack);
    const run = runSync(pack, home, publicSyncArgs(pack));
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.text, /sync: refuse: pack: HEAD is detached at [0-9a-f]+, so there is no branch to compare/);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  });
});

test('an inherited GIT_DIR / GIT_WORK_TREE does not hide a behind pack', () => {
  withPack('sync-fresh-gitdir-', ({ origin, pack, home, sandbox }) => {
    const other = path.join(sandbox, 'other');
    git(['clone', '-q', '--local', origin, other], sandbox);
    advance(origin);
    git(['-C', other, 'pull', '-q', '--ff-only'], sandbox);
    const run = runSync(pack, home, publicSyncArgs(pack), { GIT_DIR: path.join(other, '.git'), GIT_WORK_TREE: other });
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.text, /sync: refuse: pack is 1 behind origin\/main/);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  });
});

test('--check-updates is gated too: a behind pack refuses before any report', () => {
  withPack('sync-fresh-updates-', ({ origin, pack, home }) => {
    advance(origin);
    const run = runSync(pack, home, [...publicSyncArgs(pack), '--check-updates']);
    assert.notEqual(run.status, 0, run.text);
    assert.match(run.text, /sync: refuse: pack is 1 behind origin\/main/);
    assert.equal(existsSync(path.join(pack, 'updates')), false);
  });
});

test('--fixture-root outside the temp folder is refused as test-only', () => {
  withPack('sync-fresh-fixture-', ({ pack, home }) => {
    // Must be outside tmpdir() even when this pack itself lives under /tmp (the public-export canary unpacks there).
    const outside = path.resolve(tmpdir(), '..', `.not-tmp-fixture-${process.pid}`);
    try {
      const run = runSync(pack, home, [...publicSyncArgs(pack), '--fixture-root', outside, '--no-vendor', '--no-swarm']);
      assert.equal(run.status, 2, run.text);
      assert.match(run.text, /--fixture-root is test-only/);
      assert.equal(existsSync(outside), false);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});

test('--help marks --fixture-root as test only', () => {
  const r = spawnSync(process.execPath, ['scripts/sync-workspace.mjs', '--help'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /--fixture-root <dir>\s+TEST ONLY/);
});

const STRIPPED_GIT_VARS = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_NAMESPACE',
  'GIT_PREFIX',
];

const REPORT_GIT_CALLS = [
  {
    id: 'log',
    name: 'changelog git log',
    old: "const log = spawnSync('git', ['-C', history.dir, 'log', '--no-merges', '--format=%s', `${history.from}..HEAD`, '--', upstreamPath], { encoding: 'utf8', env: gitEnv() });",
  },
  {
    id: 'full',
    name: 'full git diff --no-index',
    old: "const full = spawnSync('git', [...args, 'current', 'latest'], { cwd: cmp, encoding: 'utf8', maxBuffer: 1 << 28, env: gitEnv() });",
  },
  {
    id: 'stat',
    name: 'git diff --shortstat',
    old: "const stat = spawnSync('git', [...args, '--shortstat', 'current', 'latest'], { cwd: cmp, encoding: 'utf8', env: gitEnv() }).stdout.trim();",
  },
];

function writeReportSkill(dir, body) {
  mkdirSync(path.join(dir, 'demo'), { recursive: true });
  writeFileSync(path.join(dir, 'demo', 'SKILL.md'), `---\nname: demo\n---\n# Demo\n${body}\n`);
}

function reportGitFixture(sandbox) {
  const currentDir = path.join(sandbox, 'current');
  const latestDir = path.join(sandbox, 'latest');
  writeReportSkill(currentDir, 'v1');
  writeReportSkill(latestDir, 'v2');
  const work = path.join(sandbox, 'work');
  const outDir = path.join(sandbox, 'updates');
  mkdirSync(work);
  mkdirSync(outDir);
  return {
    currentDir,
    latestDir,
    work,
    outDir,
    history: { dir: path.join(sandbox, 'history'), from: 'HEAD~1', pathFor: () => 'demo/SKILL.md' },
  };
}

function withDirtyGitEnv(fn) {
  const keys = [...STRIPPED_GIT_VARS, 'GIT_CEILING_DIRECTORIES'];
  const saved = {};
  for (const key of keys) {
    saved[key] = Object.prototype.hasOwnProperty.call(process.env, key) ? process.env[key] : undefined;
  }
  process.env.GIT_DIR = '/x/.git';
  process.env.GIT_WORK_TREE = '/x';
  process.env.GIT_INDEX_FILE = '/x/i';
  process.env.GIT_COMMON_DIR = '/x/common';
  process.env.GIT_OBJECT_DIRECTORY = '/x/objects';
  process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES = '/x/alt';
  process.env.GIT_NAMESPACE = 'ns';
  process.env.GIT_PREFIX = 'pre';
  process.env.GIT_CEILING_DIRECTORIES = '/ceil';
  try {
    return fn();
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

function classifyGitCall(args) {
  if (args.includes('log')) return 'log';
  if (args.includes('--shortstat')) return 'stat';
  if (args.includes('diff') && args.includes('--no-index')) return 'full';
  return args.join(' ');
}

function fakeGitSpawn(cmd, args, opts, gitCalls) {
  if (cmd === 'git') {
    gitCalls.push({ args: [...args], env: opts?.env });
    if (args.includes('--shortstat')) return { status: 1, stdout: ' 1 file changed, 1 insertion(+)\n', stderr: '' };
    if (args.includes('diff') && args.includes('--no-index')) return { status: 1, stdout: 'diff --git demo/SKILL.md\n', stderr: '' };
    if (args.includes('log')) return { status: 0, stdout: 'v2 subject\n', stderr: '' };
  }
  return spawnSync(cmd, args, opts);
}

function assertReportGitCallsUseGitEnv(diffTreesFn, setSpawnFn, restoreSpawnFn) {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'check-updates-gitenv-'));
  const gitCalls = [];
  setSpawnFn((cmd, args, opts) => fakeGitSpawn(cmd, args, opts, gitCalls));
  try {
    return withDirtyGitEnv(() => {
      const fx = reportGitFixture(sandbox);
      const result = diffTreesFn('demo', fx.currentDir, fx.latestDir, fx);
      assert.ok(result, 'diffTrees should report a change');
      const kinds = gitCalls.map((c) => classifyGitCall(c.args));
      const problems = [];
      if (gitCalls.length !== 3 || new Set(kinds).size !== 3) {
        problems.push(`expected log, full, and stat git calls, got: ${kinds.join(', ') || '(none)'}`);
      }
      for (const [i, call] of gitCalls.entries()) {
        if (!call.env || typeof call.env !== 'object') {
          problems.push(`call ${i} (${kinds[i]}) is missing an env option`);
          continue;
        }
        for (const key of STRIPPED_GIT_VARS) {
          if (key in call.env) problems.push(`call ${i} (${kinds[i]}) still has ${key}`);
        }
        if (call.env.GIT_CEILING_DIRECTORIES !== '/ceil') {
          problems.push(`call ${i} (${kinds[i]}) did not keep GIT_CEILING_DIRECTORIES`);
        }
      }
      return { kinds, problems, gitCalls };
    });
  } finally {
    restoreSpawnFn();
    rmSync(sandbox, { recursive: true, force: true });
  }
}

function rewriteCheckUpdatesImports(src) {
  return src.replace(
    "from './sync-freshness.mjs'",
    `from ${JSON.stringify(pathToFileURL(path.join(root, 'scripts/sync-freshness.mjs')).href)}`,
  );
}

async function importMutatedCheckUpdates(mutatedSource) {
  const dir = mkdtempSync(path.join(tmpdir(), 'mutated-check-updates-'));
  const file = path.join(dir, 'check-updates.mjs');
  writeFileSync(file, rewriteCheckUpdatesImports(mutatedSource));
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}-${Math.random()}`);
  return { dir, mod };
}

function mutateReportCall(src, site, kind) {
  if (!src.includes(site.old)) throw new Error(`site ${site.id} not found`);
  let next;
  if (kind === 'drop') next = site.old.replace(', env: gitEnv()', '');
  else if (kind === 'comment') next = site.old.replace(', env: gitEnv()', ', /* env: gitEnv() */');
  else if (kind === 'decoy') next = site.old.replace(', env: gitEnv()', ", decoy: 'env: gitEnv()'");
  else throw new Error(kind);
  if (next === site.old) throw new Error(`mutation ${kind} on ${site.id} did not change the call`);
  return src.replace(site.old, next);
}

test('every spawnSync git call in check-updates uses gitEnv', () => {
  const { problems, gitCalls } = assertReportGitCallsUseGitEnv(diffTrees, setSpawnSyncForTests, () => setSpawnSyncForTests());
  assert.equal(gitCalls.length, 3);
  assert.deepEqual(problems, [], problems.join('\n') || undefined);
});

test('comment-wrapped or string-decoy env on a report git spawn is red', async () => {
  const original = readFileSync(new URL('./check-updates.mjs', import.meta.url), 'utf8');
  const cases = [];
  for (const site of REPORT_GIT_CALLS) {
    cases.push(['comment', site], ['decoy', site]);
  }
  for (const [kind, site] of cases) {
    const { dir, mod } = await importMutatedCheckUpdates(mutateReportCall(original, site, kind));
    try {
      const { problems } = assertReportGitCallsUseGitEnv(mod.diffTrees, mod.setSpawnSyncForTests, () => mod.setSpawnSyncForTests());
      assert.ok(
        problems.some((p) => p.includes('missing an env option') || p.includes('still has')),
        `${kind} on ${site.id} stayed green: ${JSON.stringify(problems)}`,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('dropping env: gitEnv() from any one check-updates git spawn is red', async () => {
  const original = readFileSync(new URL('./check-updates.mjs', import.meta.url), 'utf8');
  for (const site of REPORT_GIT_CALLS) {
    const { dir, mod } = await importMutatedCheckUpdates(mutateReportCall(original, site, 'drop'));
    try {
      const { problems } = assertReportGitCallsUseGitEnv(mod.diffTrees, mod.setSpawnSyncForTests, () => mod.setSpawnSyncForTests());
      assert.ok(
        problems.some((p) => p.includes('missing an env option') || p.includes('still has')),
        `drop on ${site.id} stayed green: ${JSON.stringify(problems)}`,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});
