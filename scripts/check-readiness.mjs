#!/usr/bin/env node
// Pack readiness aggregate. Runs the checks this repository actually has.
// A missing product gate is BLOCKED. It is not a PASS and it is not a waiver.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = [];

function git(args) {
  const run = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (run.status !== 0) {
    console.error(run.stderr || run.stdout);
    process.exit(1);
  }
  return run.stdout.trim();
}

function record(name, result, detail) {
  rows.push({ name, result, detail });
  console.log(`${result} ${name}${detail ? ` — ${detail}` : ''}`);
}

function runNode(name, args) {
  const run = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  const tail = `${run.stdout || ''}${run.stderr || ''}`.trim().split('\n').filter(Boolean).slice(-2).join(' | ');
  record(name, run.status === 0 ? 'PASS' : 'FAIL', tail);
  return run.status === 0;
}

const head = git(['rev-parse', 'HEAD']);
const base = git(['rev-parse', 'origin/main']);
const tree = git(['rev-parse', 'HEAD^{tree}']);
console.log(`head ${head}`);
console.log(`base ${base}`);
console.log(`tree ${tree}`);

let ranFailed = false;
for (const [name, args] of [
  ['check-steps', ['scripts/check-steps.mjs']],
  ['check-shared-flow', ['scripts/check-shared-flow.mjs']],
  ['check-shared-flow.test', ['--test', 'scripts/check-shared-flow.test.mjs']],
]) {
  if (!runNode(name, args)) ranFailed = true;
}

const fixture = mkdtempSync(path.join(tmpdir(), 'umbrella-ready-'));
try {
  const run = spawnSync(process.execPath, [
    'scripts/sync-workspace.mjs',
    '--fixture-root',
    fixture,
    '--no-vendor',
    '--no-swarm',
  ], { cwd: root, encoding: 'utf8' });
  const binding = path.join(fixture, 'umbrella', 'private-bindings.md');
  const owned = path.join(fixture, 'wip-owned', 'SKILL.md');
  const skill = existsSync(path.join(fixture, 'umbrella', 'SKILL.md'))
    ? readFileSync(path.join(fixture, 'umbrella', 'SKILL.md'), 'utf8')
    : '';
  const homeWrite = /\/\.(cursor|claude|grok|agents|copilot)\/skills|\/home\/box\/agent-data/.test(`${run.stdout || ''}${run.stderr || ''}`);
  const ok = run.status === 0
    && existsSync(binding)
    && existsSync(owned)
    && readFileSync(owned, 'utf8').includes('owned by another installer')
    && !skill.includes('private-bindings.md')
    && !homeWrite;
  record('install-fixture', ok ? 'PASS' : 'FAIL', fixture);
  if (!ok) {
    ranFailed = true;
    process.stdout.write(run.stdout || '');
    process.stderr.write(run.stderr || '');
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

const archived = spawnSync('git', ['archive', '--format=tar', 'HEAD'], { cwd: root });
const names = spawnSync('tar', ['-t'], { input: archived.stdout, encoding: 'utf8' });
const listing = names.stdout || '';
const leaked = listing.includes('private-bindings.md') || listing.includes('vendor/');
record('public-archive', leaked || archived.status !== 0 ? 'FAIL' : 'PASS', leaked ? 'private binding or vendor present' : 'private-bindings.md and vendor/ omitted');
if (leaked || archived.status !== 0) ranFailed = true;

const denylist = process.env.PUBLIC_SAFE_DENYLIST || '';
if (!denylist) {
  record('check-public-safe', 'NOT RUN', 'PUBLIC_SAFE_DENYLIST is unset; not a pass and not a content failure');
} else if (!existsSync(denylist)) {
  record('check-public-safe', 'NOT RUN', 'PUBLIC_SAFE_DENYLIST path is missing; not a pass');
  ranFailed = true;
} else {
  const candidate = mkdtempSync(path.join(tmpdir(), 'umbrella-public-'));
  try {
    const archive = spawnSync('git', ['archive', '--format=tar', 'HEAD'], { cwd: root });
    const extract = spawnSync('tar', ['-x', '-C', candidate], { input: archive.stdout });
    const init = spawnSync('git', ['init', '-b', 'main'], { cwd: candidate, encoding: 'utf8' });
    const add = spawnSync('git', ['add', '-A'], { cwd: candidate, encoding: 'utf8' });
    const commit = spawnSync('git', [
      '-c', 'user.email=readiness@local',
      '-c', 'user.name=readiness',
      'commit', '-m', 'public archive candidate',
    ], { cwd: candidate, encoding: 'utf8' });
    const built = archive.status === 0 && extract.status === 0 && init.status === 0 && add.status === 0 && commit.status === 0;
    const scan = spawnSync(process.execPath, [path.join(candidate, 'scripts/check-public-safe.mjs'), '--tree'], {
      cwd: candidate,
      encoding: 'utf8',
      env: { ...process.env, PUBLIC_SAFE_DENYLIST: denylist },
    });
    const text = `${scan.stdout || ''}${scan.stderr || ''}`;
    const detail = text.trim().split('\n').filter(Boolean).slice(-4).join(' | ');
    const pass = built && scan.status === 0 && text.includes('gitleaks dir ') && text.includes('check:public-safe PASS') && text.includes('gitleaks 0') && text.includes('denylist 0');
    record('check-public-safe', pass ? 'PASS' : 'FAIL', `exit=${scan.status} ${detail}`);
    if (!pass) ranFailed = true;
  } finally {
    rmSync(candidate, { recursive: true, force: true });
  }
}

record('commands.pr_ready', 'N/A', 'not applicable to this pack; no project.yml by design; not a pass');
record('tech-lead-review', 'EXTERNAL', 'needs an independent owner receipt; this script does not record GO or BLOCKED');
record('code-review', 'EXTERNAL', 'needs an independent owner receipt; this script does not record GO');
record('build-verifier', 'EXTERNAL', 'needs an independent owner receipt; this script does not record GO');
record('dispatch', 'EXTERNAL', 'merge stays held until that receipt; this script does not record GO');
record('device-qa', 'N/A', 'this diff is not phone-visible');
record('db-migrate', 'N/A', 'this diff adds no SQL migration');

console.log('---');
for (const row of rows) console.log(`${row.result}\t${row.name}\t${row.detail}`);
if (ranFailed) {
  console.log('MECHANICAL FAIL');
  process.exit(1);
}
console.log('MECHANICAL PASS');
console.log('MERGE HELD until independent TL, CR, BV, and Dispatch receipts; this script does not certify GO');
process.exit(0);
