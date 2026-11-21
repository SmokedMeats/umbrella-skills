import { spawnSync } from 'node:child_process';
import { globSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tracksBinding } from './tracks-binding.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(cwd, args) {
  const run = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  return (run.stdout || '').trim();
}

// Run the same raw suite a public clone runs (`node --test scripts/*.test.mjs`)
// against a `git archive` export. Source-only tests must skip or use --public
// fixtures; otherwise this fails and the export cannot ship red tests.
test('the public export test suite has no failures', {
  skip: tracksBinding(root) ? false : 'already a public snapshot',
  timeout: 120_000,
}, () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'public-export-suite-'));
  const tree = path.join(sandbox, 'tree');
  try {
    mkdirSync(tree);
    const archive = spawnSync('git', ['archive', '--format=tar', 'HEAD'], {
      cwd: root,
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (archive.status !== 0) throw new Error(String(archive.stderr));
    const untar = spawnSync('tar', ['-x', '-C', tree], { input: archive.stdout, encoding: 'buffer' });
    if (untar.status !== 0) throw new Error(String(untar.stderr));

    git(tree, ['init', '-b', 'main']);
    git(tree, ['config', 'user.email', 'public-export@local']);
    git(tree, ['config', 'user.name', 'public-export']);
    git(tree, ['add', '-A']);
    git(tree, ['commit', '-m', 'public export']);
    git(tree, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);

    const files = globSync('scripts/*.test.mjs', { cwd: tree }).sort();
    const env = { ...process.env };
    for (const key of Object.keys(env)) {
      if (key === 'NODE_TEST_CONTEXT' || key.startsWith('NODE_TEST_')) delete env[key];
    }
    const run = spawnSync(process.execPath, ['--test', '--test-reporter', 'tap', ...files], {
      cwd: tree,
      encoding: 'utf8',
      timeout: 110_000,
      env,
    });
    const text = `${run.stdout || ''}${run.stderr || ''}`;
    const failLine = text.split('\n').find((line) => /^# fail\b/.test(line));
    const failCount = failLine ? Number(failLine.replace(/^# fail\s+/, '').trim()) : NaN;
    assert.equal(Number.isNaN(failCount) ? 'missing # fail line' : failCount, 0, text);
    assert.equal(run.status, 0, text);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
