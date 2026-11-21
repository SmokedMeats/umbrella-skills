import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { gitEnv } from './sync-freshness.mjs';
import { BINDING_REL, tracksBinding } from './tracks-binding.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Source-only tests plus the public-export canary. Each must keep
// `skip: tracksBinding(root) ? false : ...` so a private clone still runs them.
const SOURCE_ONLY_TESTS = [
  { file: 'scripts/public-export-suite.test.mjs', name: 'the public export test suite has no failures' },
  { file: 'scripts/check-readiness.test.mjs', name: 'public readiness on the source pack fails closed' },
  { file: 'scripts/check-readiness.test.mjs', name: 'default source readiness still passes its source rows without a denylist' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'PR 56 head fails the shared-flow contract' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'live pack satisfies shared full-flow' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'umbrella skill copy lands the private binding on an install root' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'fixture-root installs the binding and leaves an unmarked skill' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'fixture-root does not write outside the fixture when a private overlay is visible' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'a dirty file inside pack-owned umbrella is kept and the copy is refused' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'a clean installed mirror can be copied again' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'an identical tree with no baseline is adopted' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'a differing tree with no baseline is kept and refused' },
  { file: 'scripts/check-shared-flow.test.mjs', name: 'a symlink edit after a clean baseline is kept and refused' },
  { file: 'scripts/check-pr-ready.test.mjs', name: 'a private layout with the tracked binding deleted still fails closed' },
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function liveSkipPattern(name) {
  const q = escapeRegExp(name);
  return new RegExp(
    String.raw`test\(\s*(['"])${q}\1\s*,\s*\{[^}]*\bskip:\s*tracksBinding\(root\)\s*\?\s*false\s*:`,
  );
}

function sourceTextGaps() {
  const missing = [];
  for (const { file, name } of SOURCE_ONLY_TESTS) {
    const text = readFileSync(path.join(root, file), 'utf8');
    if (!liveSkipPattern(name).test(text)) missing.push(`${name} (${file})`);
  }
  return missing;
}

/** Independent of tracksBinding(): does HEAD track the private binding? */
function headTracksBinding(cwd) {
  const run = spawnSync('git', ['-C', cwd, 'cat-file', '-e', `HEAD:${BINDING_REL}`], {
    encoding: 'utf8',
    env: gitEnv(),
  });
  return run.status === 0;
}

function childEnv() {
  const env = gitEnv();
  for (const key of Object.keys(env)) {
    if (key === 'NODE_TEST_CONTEXT' || key.startsWith('NODE_TEST_')) delete env[key];
  }
  return env;
}

function tapDirective(token) {
  if (!token) return '';
  return token.replace(/[^A-Za-z].*$/, '').toUpperCase();
}

function tapStatus(text, name) {
  const re = new RegExp(String.raw`^(not )?ok \d+ - ${escapeRegExp(name)}(?:\s+#\s*(\S+))?`, 'm');
  const m = text.match(re);
  if (!m) return 'missing';
  const directive = tapDirective(m[2]);
  if (directive === 'SKIP') return 'skipped';
  if (directive === 'TODO') return 'todo';
  if (m[1]) return 'failed';
  return 'passed';
}

function runSourceOnlyTap() {
  const files = [...new Set(SOURCE_ONLY_TESTS.map((t) => t.file))];
  const args = ['--test', '--test-reporter', 'tap'];
  for (const { name } of SOURCE_ONLY_TESTS) args.push('--test-name-pattern', `^${escapeRegExp(name)}$`);
  args.push(...files);
  const run = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 450_000,
    env: childEnv(),
  });
  return `${run.stdout || ''}${run.stderr || ''}`;
}

// Always runs (no skip). On a private clone, fails if any of the 14 source-only
// tests or the canary is skipped, marked todo, or missing from the TAP. ok or
// not ok both count as reported; # SKIP and # TODO (any case) do not. Pass/fail
// is the outer suite's job. On a public snapshot (binding untracked) those 14
// may skip; this guard still passes.
test('source-only tests and the canary still run when the binding is tracked', { timeout: 480_000 }, () => {
  assert.equal(SOURCE_ONLY_TESTS.length, 14);
  const textGaps = sourceTextGaps();
  const tracked = headTracksBinding(root);
  assert.equal(tracksBinding(root), tracked);

  if (!tracked) {
    // Public snapshot: the 14 tests may skip. Do not require them to run.
    return;
  }

  assert.equal(
    textGaps.length,
    0,
    `HEAD tracks ${BINDING_REL}, but these tests no longer use skip: tracksBinding(root) ? false : ...: ${textGaps.join('; ')}`,
  );

  const tap = runSourceOnlyTap();
  const problems = [];
  for (const { name, file } of SOURCE_ONLY_TESTS) {
    const status = tapStatus(tap, name);
    if (status === 'skipped' || status === 'todo' || status === 'missing') {
      problems.push(`${name} (${file}): ${status}`);
    }
  }
  assert.equal(
    problems.length,
    0,
    `HEAD tracks ${BINDING_REL}, but these source-only tests or the canary were not reported as run (skipped, todo, or missing):\n${problems.join('\n')}\n\n${tap}`,
  );
});

test('tapStatus treats SKIP and TODO as not run, case-insensitively', () => {
  const name = 'live pack satisfies shared full-flow';
  const cases = [
    [`ok 1 - ${name} # TODO`, 'todo'],
    [`ok 1 - ${name} # todo`, 'todo'],
    [`ok 1 - ${name} # ToDo`, 'todo'],
    [`not ok 1 - ${name} # TODO`, 'todo'],
    [`not ok 1 - ${name} # todo`, 'todo'],
    [`ok 1 - ${name} # SKIP`, 'skipped'],
    [`ok 1 - ${name} # skip`, 'skipped'],
    [`not ok 1 - ${name} # SKIP`, 'skipped'],
    [`ok 1 - ${name}`, 'passed'],
    [`not ok 1 - ${name}`, 'failed'],
    [`# ok 1 - ${name} # TODO`, 'missing'],
  ];
  for (const [line, expected] of cases) {
    assert.equal(tapStatus(`${line}\n`, name), expected, line);
  }
  assert.equal(tapStatus('ok 1 - other\n', name), 'missing');
});

test('{ todo: true } and test.todo TAP lines are not counted as run', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'todo-mutation-'));
  try {
    const file = path.join(dir, 'todo-mutation.test.mjs');
    writeFileSync(
      file,
      "import { test } from 'node:test';\n" +
        "test('options todo true fixture', { todo: true }, () => {});\n" +
        "test.todo('test.todo fixture', () => {});\n",
    );
    const run = spawnSync(process.execPath, ['--test', '--test-reporter', 'tap', file], {
      encoding: 'utf8',
      env: childEnv(),
      timeout: 10_000,
    });
    const tap = `${run.stdout || ''}${run.stderr || ''}`;
    assert.equal(tapStatus(tap, 'options todo true fixture'), 'todo', tap);
    assert.equal(tapStatus(tap, 'test.todo fixture'), 'todo', tap);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('tracksBinding ignores an inherited GIT_DIR', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'tracks-binding-gitdir-'));
  try {
    const expected = tracksBinding(root);
    const bogus = path.join(sandbox, 'no-such-gitdir');
    assert.equal(
      tracksBinding(root, { ...process.env, GIT_DIR: bogus, GIT_WORK_TREE: sandbox }),
      expected,
    );

    const empty = path.join(sandbox, 'empty');
    mkdirSync(empty);
    const init = spawnSync('git', ['init', '-q', '-b', 'main'], {
      cwd: empty,
      encoding: 'utf8',
      env: gitEnv(),
    });
    assert.equal(init.status, 0, init.stderr);
    writeFileSync(path.join(empty, 'README.md'), 'empty\n');
    const git = (args) =>
      spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args], {
        cwd: empty,
        encoding: 'utf8',
        env: gitEnv(),
      });
    const add = git(['add', 'README.md']);
    assert.equal(add.status, 0, add.stderr);
    const commit = git(['commit', '-q', '-m', 'seed']);
    assert.equal(commit.status, 0, commit.stderr);
    assert.equal(tracksBinding(empty), false);
    assert.equal(
      tracksBinding(empty, { ...process.env, GIT_DIR: path.join(root, '.git'), GIT_WORK_TREE: root }),
      false,
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
