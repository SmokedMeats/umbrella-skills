#!/usr/bin/env node
// Pack readiness aggregate. Runs the checks this repository actually has.
// A missing product gate is BLOCKED. It is not a PASS and it is not a waiver.
//
//   node scripts/check-readiness.mjs            # source pack. Fails closed when the binding is missing.
//   node scripts/check-readiness.mjs --public   # explicit public snapshot. Never inferred.
//
// Public mode runs the supported public flow, the public install fixture, and the
// archive omission check. Source-only rows are reported NOT APPLICABLE. That is
// not a pass, and it is not a claim that the full raw suite passed.
// The public fixture is --fixture-root --no-vendor --no-swarm. It does not copy
// project config and does not exercise swarm replacement.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const PUBLIC = args.includes('--public');
const unknown = args.filter((arg) => arg !== '--public');
if (unknown.length > 0) {
  console.error(`Unknown argument: ${unknown[0]}`);
  process.exit(2);
}

const rows = [];

function git(gitArgs, required = true) {
  const run = spawnSync('git', gitArgs, { cwd: root, encoding: 'utf8' });
  if (run.status !== 0) {
    if (!required) return '';
    console.error(run.stderr || run.stdout);
    process.exit(1);
  }
  return run.stdout.trim();
}

function record(name, result, detail) {
  rows.push({ name, result, detail });
  console.log(`${result} ${name}${detail ? ` — ${detail}` : ''}`);
}

function childEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  // A parent `node --test` marks this process. Leave it set and the nested
  // suite is skipped and reported as a pass. That is not a pass.
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_WORKER_ID;
  return env;
}

function runNode(name, nodeArgs) {
  const run = spawnSync(process.execPath, nodeArgs, { cwd: root, encoding: 'utf8', env: childEnv() });
  const tail = `${run.stdout || ''}${run.stderr || ''}`.trim().split('\n').filter(Boolean).slice(-2).join(' | ');
  record(name, run.status === 0 ? 'PASS' : 'FAIL', tail);
  return run.status === 0;
}

function notApplicable(name, detail) {
  record(name, 'NOT APPLICABLE', detail);
}

const head = git(['rev-parse', 'HEAD']);
const base = git(['rev-parse', 'origin/main'], false);
const tree = git(['rev-parse', 'HEAD^{tree}']);
console.log(`head ${head}`);
console.log(`base ${base || 'unavailable'}`);
console.log(`tree ${tree}`);
console.log(`mode ${PUBLIC ? 'public' : 'source'}`);

let ranFailed = false;
const sourceOnly = 'source pack check; not a pass';
const fullSuite = 'full raw suite is source-only and is not a public pass; not executed';
const sourceFixture = 'source fixture requires the installed private binding; not a pass';
const publicOnly = 'public snapshot check; not a pass on the source command';

if (!runNode('check-steps', ['scripts/check-steps.mjs'])) ranFailed = true;

if (PUBLIC) {
  notApplicable('check-shared-flow', sourceOnly);
  if (!runNode('check-shared-flow-public', ['scripts/check-shared-flow.mjs', '--public'])) ranFailed = true;
  notApplicable('check-shared-flow.test', fullSuite);
  notApplicable('install-fixture', sourceFixture);
} else {
  if (!runNode('check-shared-flow', ['scripts/check-shared-flow.mjs'])) ranFailed = true;
  notApplicable('check-shared-flow-public', publicOnly);
  if (!runNode('check-shared-flow.test', ['--test', 'scripts/check-shared-flow.test.mjs'])) ranFailed = true;
  notApplicable('install-fixture-public', publicOnly);
}

function runFixture(publicMode) {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-ready-'));
  const fixture = path.join(sandbox, 'fixture');
  const home = path.join(sandbox, 'home');
  const nodeArgs = ['scripts/sync-workspace.mjs', '--fixture-root', fixture, '--no-vendor', '--no-swarm'];
  if (publicMode) nodeArgs.splice(1, 0, '--public');
  const run = spawnSync(process.execPath, nodeArgs, {
    cwd: root,
    encoding: 'utf8',
    env: childEnv({ HOME: home, USERPROFILE: home }),
  });
  const text = `${run.stdout || ''}${run.stderr || ''}`;
  const binding = path.join(fixture, 'umbrella', 'private-bindings.md');
  const owned = path.join(fixture, 'wip-owned', 'SKILL.md');
  const skillPath = path.join(fixture, 'umbrella', 'SKILL.md');
  const skill = existsSync(skillPath) ? readFileSync(skillPath, 'utf8') : '';
  const homeWrite = /\/\.(cursor|claude|grok|agents|copilot)\/skills|\/home\/box\/agent-data/.test(text)
    || existsSync(path.join(home, '.cursor', 'skills'));
  const installed = existsSync(fixture)
    ? readdirSync(fixture).filter((name) => name !== 'wip-owned' && existsSync(path.join(fixture, name, 'SKILL.md')))
    : [];
  const tail = text.trim().split('\n').filter(Boolean).slice(-2).join(' | ');
  let ok = false;
  if (publicMode) {
    ok = run.status === 0
      && !existsSync(binding)
      && existsSync(owned)
      && readFileSync(owned, 'utf8').includes('owned by another installer')
      && existsSync(skillPath)
      && !skill.includes('private-bindings.md')
      && installed.length === 22
      && text.includes('fixture binding: omitted')
      && !homeWrite;
  } else {
    ok = run.status === 0
      && existsSync(binding)
      && existsSync(owned)
      && readFileSync(owned, 'utf8').includes('owned by another installer')
      && !skill.includes('private-bindings.md')
      && !homeWrite;
  }
  rmSync(sandbox, { recursive: true, force: true });
  return { ok, tail, text };
}

if (PUBLIC) {
  const fixture = runFixture(true);
  record('install-fixture-public', fixture.ok ? 'PASS' : 'FAIL', fixture.ok ? 'binding omitted; 22 skills; no home write' : fixture.tail);
  if (!fixture.ok) {
    ranFailed = true;
    process.stdout.write(fixture.text);
  }
} else {
  const fixture = runFixture(false);
  record('install-fixture', fixture.ok ? 'PASS' : 'FAIL', fixture.ok ? 'binding installed; no home write' : fixture.tail);
  if (!fixture.ok) {
    ranFailed = true;
    process.stdout.write(fixture.text);
  }
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
      env: childEnv({ PUBLIC_SAFE_DENYLIST: denylist }),
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
record('tech-lead-review', 'EXTERNAL', 'money, auth, or migrations on a high land gate only; this script does not record the verdict');
record('code-review', 'EXTERNAL', 'needs an independent owner receipt; this script does not record the verdict');
record('build-verifier', 'EXTERNAL', 'the one AC audit when the land gate is high or risk is missing; this script does not record the verdict');
record('dispatch', 'EXTERNAL', 'land order and hot-file conflicts only; this script does not record a per-PR GO');
record('device-qa', 'N/A', 'this diff is not phone-visible');
record('db-migrate', 'N/A', 'this diff adds no SQL migration');

console.log('---');
for (const row of rows) console.log(`${row.result}\t${row.name}\t${row.detail}`);
if (ranFailed) {
  console.log('MECHANICAL FAIL');
  process.exit(1);
}
console.log('MECHANICAL PASS');
if (PUBLIC) {
  console.log('PUBLIC CHECKS ONLY; source-only rows are NOT APPLICABLE and are not a pass');
  console.log('FULL SUITE NOT A PASS; the raw public suite result is not turned into a pass');
}
console.log('MECHANICAL PASS is not a merge. Land follows CONVENTIONS Land gate. This script does not certify a merge.');
process.exit(0);
