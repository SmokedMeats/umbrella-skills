#!/usr/bin/env node
// Pack pr-ready gate. The last line is the verdict:
//   pr-ready: PASS <full HEAD sha>
//   pr-ready: FAIL <reasons>
//
// There is no root package.json, so the command is:
//   node scripts/check-pr-ready.mjs
//
// PUBLIC_SAFE_DENYLIST must be set to an existing file. An unset or missing
// path fails closed. This gate does not treat git config or a sibling
// denylist as a pass.
//
// Public-safe, via scripts/check-public-safe.mjs (its allowlist, no extra
// exception in this file):
//   --tree  on a git archive of HEAD. export-ignore paths are already absent
//           from that tree, including skills/umbrella/private-bindings.md.
//   --range origin/main..HEAD on this checkout. That scan reads commits.
// Structural: scripts/check-steps.mjs and scripts/check-shared-flow.mjs.
// A public snapshot is a git archive: skills/umbrella/private-bindings.md is
// export-ignore, absent from HEAD, and absent from this clone's history.
// That case runs check-shared-flow --public (binding presence and content
// checks skipped) and prints one line saying so. A private clone has the
// path in history, so a deleted or broken binding stays on the source check
// and fails closed. The installer does not infer --public from a missing file.
// A dirty working tree or index fails before those checks, so a PASS names
// HEAD and the file checks read that commit's content. origin/main must be
// an ancestor of HEAD.
// Generated or installed copies: skipped in one line when this repo has none.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_COPY_MARKERS = new Set(['export-manifest.json', 'install-manifest.json']);
// Same path as INSTALLED_BINDING in check-shared-flow.mjs. Kept here so this
// script still loads in a tree that has not copied that file yet.
const BINDING_PATH = 'skills/umbrella/private-bindings.md';

function git(args, cwd = root) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
}

function childEnv() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_WORKER_ID;
  return env;
}

function linesOf(text) {
  return `${text || ''}`.split('\n').map((line) => line.trim()).filter(Boolean);
}

function detailFrom(text, status, verdictPrefix) {
  const lines = linesOf(text);
  const verdict = verdictPrefix
    ? [...lines].reverse().find((line) => line.startsWith(verdictPrefix))
    : lines[lines.length - 1];
  return (verdict || lines[lines.length - 1] || `exit ${status}`).replace(/\s+/g, ' ');
}

function denylistProblem() {
  const file = process.env.PUBLIC_SAFE_DENYLIST;
  if (!file || !file.trim()) return 'PUBLIC_SAFE_DENYLIST is unset';
  if (!existsSync(file)) return `PUBLIC_SAFE_DENYLIST is missing (${file})`;
  return '';
}

function dirtyProblem() {
  const status = git(['status', '--porcelain=v1', '--untracked-files=normal']);
  if (status.status !== 0) return 'clean-tree check failed';
  if (status.stdout) return 'working tree or index is dirty';
  return '';
}

function behindProblem() {
  const base = git(['rev-parse', '--verify', '-q', 'origin/main']);
  if (base.status !== 0) return 'origin/main is missing';
  const ancestor = git(['merge-base', '--is-ancestor', 'origin/main', 'HEAD']);
  if (ancestor.status !== 0) return 'origin/main is not an ancestor of HEAD';
  return '';
}

function runNode(scriptArgs, cwd, verdictPrefix) {
  const run = spawnSync(process.execPath, scriptArgs, {
    cwd,
    encoding: 'utf8',
    env: childEnv(),
    maxBuffer: 1 << 28,
  });
  if (run.error) return { ok: false, detail: run.error.message };
  return {
    ok: run.status === 0,
    detail: detailFrom(`${run.stdout || ''}${run.stderr || ''}`, run.status, verdictPrefix),
  };
}

function publicSafe(scriptArgs, cwd) {
  return runNode(
    [path.join(cwd, 'scripts', 'check-public-safe.mjs'), ...scriptArgs],
    cwd,
    'check:public-safe ',
  );
}

// The scanner's --tree walks git ls-files. export-ignore paths stay in that
// list. Publish and readiness already scan the git archive, which omits them.
// Reuse that export, then the scanner's own allowlist. No new exception.
function scanExportedTree() {
  const candidate = mkdtempSync(path.join(tmpdir(), 'pr-ready-export-'));
  try {
    const archive = spawnSync('git', ['archive', '--format=tar', 'HEAD'], {
      cwd: root,
      maxBuffer: 1 << 28,
    });
    if (archive.status !== 0) return { ok: false, detail: detailFrom(archive.stderr, archive.status) || 'git archive failed' };
    const extract = spawnSync('tar', ['-x', '-C', candidate], { input: archive.stdout });
    if (extract.status !== 0) return { ok: false, detail: 'export extract failed' };
    const init = git(['init', '-b', 'main'], candidate);
    if (init.status !== 0) return { ok: false, detail: 'export git init failed' };
    git(['config', 'user.email', 'pr-ready@local'], candidate);
    git(['config', 'user.name', 'pr-ready'], candidate);
    if (git(['add', '-A'], candidate).status !== 0) return { ok: false, detail: 'export git add failed' };
    const commit = git(['commit', '-m', 'export'], candidate);
    if (commit.status !== 0) return { ok: false, detail: detailFrom(commit.stderr, commit.status) || 'export commit failed' };
    return publicSafe(['--tree'], candidate);
  } finally {
    rmSync(candidate, { recursive: true, force: true });
  }
}

function scanRange() {
  const base = git(['rev-parse', '--verify', '-q', 'origin/main']);
  if (base.status !== 0) return { ok: false, detail: 'origin/main is missing' };
  return publicSafe(['--range', 'origin/main..HEAD'], root);
}

const PUBLIC_FLOW_LINE = 'check-shared-flow: public mode; binding export-ignore and absent; skipped binding presence and content checks';

function attributeSet(name) {
  const listed = git(['check-attr', name, '--', BINDING_PATH]);
  if (listed.status !== 0) return false;
  return listed.stdout.split('\n').some((line) => line.trim().endsWith(`: ${name}: set`));
}

function bindingAbsentFromHead() {
  return git(['cat-file', '-e', `HEAD:${BINDING_PATH}`]).status !== 0;
}

// A private clone records this path, including the commit that later deletes
// it. A git-archive snapshot inits a new history that never has the path.
function bindingRecordedInHistory() {
  const listed = git(['rev-list', '-1', '--all', '--', BINDING_PATH]);
  if (listed.status !== 0) return true;
  return listed.stdout.trim().length > 0;
}

function usePublicSharedFlow() {
  return attributeSet('export-ignore') && bindingAbsentFromHead() && !bindingRecordedInHistory();
}

function generatedCopyProblems() {
  const listed = git(['ls-files', '-z']);
  if (listed.status !== 0) return ['generated copies: git ls-files failed'];
  const found = listed.stdout.split('\0').filter((file) =>
    file && (GENERATED_COPY_MARKERS.has(file) || file.endsWith('.sync-workspace-baseline'))
  );
  if (found.length === 0) {
    console.log('generated copies: none; skipped');
    return [];
  }
  return [`hand-edited generated copies: ${found.join(', ')}`];
}

function finish(problems) {
  if (problems.length === 0) {
    const sha = git(['rev-parse', 'HEAD']);
    if (sha.status !== 0) {
      console.log('pr-ready: FAIL HEAD sha unavailable');
      process.exit(1);
    }
    console.log(`pr-ready: PASS ${sha.stdout.trim()}`);
    process.exit(0);
  }
  console.log(`pr-ready: FAIL ${problems.join('; ')}`);
  process.exit(1);
}

const deny = denylistProblem();
if (deny) finish([deny]);

const problems = [];
const dirty = dirtyProblem();
if (dirty) problems.push(dirty);
const behind = behindProblem();
if (behind) problems.push(behind);
if (problems.length > 0) finish(problems);

const tree = scanExportedTree();
if (!tree.ok) problems.push(`public-safe tree: ${tree.detail}`);
const range = scanRange();
if (!range.ok) problems.push(`public-safe range: ${range.detail}`);
const steps = runNode([path.join(root, 'scripts', 'check-steps.mjs')], root);
if (!steps.ok) problems.push(`check-steps: ${steps.detail}`);
const flowArgs = [path.join(root, 'scripts', 'check-shared-flow.mjs')];
if (usePublicSharedFlow()) {
  console.log(PUBLIC_FLOW_LINE);
  flowArgs.push('--public');
}
const flow = runNode(flowArgs, root);
if (!flow.ok) problems.push(`check-shared-flow: ${flow.detail}`);
problems.push(...generatedCopyProblems());
finish(problems);
