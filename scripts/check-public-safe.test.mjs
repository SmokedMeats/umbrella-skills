import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const script = path.join(root, 'scripts', 'check-public-safe.mjs');

function git(cwd, args) {
  const run = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  return (run.stdout || '').trim();
}

test('a non-zero gitleaks exit with an empty report fails closed', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'public-safe-empty-'));
  const bin = mkdtempSync(path.join(tmpdir(), 'gitleaks-empty-'));
  const denylist = path.join(tmpdir(), `denylist-empty-${path.basename(dir)}.txt`);
  try {
    git(dir, ['init', '-b', 'main']);
    git(dir, ['config', 'user.email', 'public-safe@local']);
    git(dir, ['config', 'user.name', 'public-safe']);
    writeFileSync(path.join(dir, 'README.md'), 'clean\n');
    git(dir, ['add', 'README.md']);
    git(dir, ['commit', '-m', 'init']);
    writeFileSync(path.join(dir, 'note.txt'), 'another commit so the range is not empty\n');
    git(dir, ['add', 'note.txt']);
    git(dir, ['commit', '-m', 'note']);
    writeFileSync(denylist, 'zz-no-match-pattern\n');
    const standin = path.join(bin, 'gitleaks');
    writeFileSync(
      standin,
      `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === 'version') process.exit(0);
const flag = args.indexOf('--report-path');
if (flag >= 0) writeFileSync(args[flag + 1], '[]');
process.exit(1);
`,
    );
    chmodSync(standin, 0o755);
    const run = spawnSync(node, [script, '--range', 'HEAD~1..HEAD'], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        PUBLIC_SAFE_DENYLIST: denylist,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      },
    });
    const text = `${run.stdout || ''}${run.stderr || ''}`;
    assert.notEqual(run.status, 0, text);
    assert.match(text, /check:public-safe FAIL /);
    assert.match(text, /gitleaks error \(fail closed\): gitleaks exited non-zero with no findings/);
    assert.equal(text.includes('check:public-safe PASS'), false);
    assert.equal(text.includes('gitleaks 0'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(bin, { recursive: true, force: true });
    rmSync(denylist, { force: true });
  }
});
