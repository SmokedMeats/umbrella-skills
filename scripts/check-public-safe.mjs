#!/usr/bin/env node
// check:public-safe — local pre-push gate for public repos.
//
// 1. gitleaks over the commits being pushed.
// 2. Private denylist (regex per line) over every added line, new file path,
//    and commit message in those commits.
//
// The denylist is private and is NOT in this repo. Lookup order:
//   1. env PUBLIC_SAFE_DENYLIST (absolute path to denylist.txt)
//   2. git config publicsafe.denylist
//   3. first sibling repo with public-safe/denylist.txt (../*/public-safe/denylist.txt)
// No denylist -> FAIL (closed). An allowlist.txt next to it is optional.
//
// Usage:
//   node scripts/check-public-safe.mjs                 # origin default branch..HEAD
//   node scripts/check-public-safe.mjs --base <ref>    # <ref>..HEAD (stacked PRs)
//   node scripts/check-public-safe.mjs --range A..B    # explicit range
//   node scripts/check-public-safe.mjs --tree          # denylist over every tracked file at HEAD (audit)
//   .githooks/pre-push calls it with --pre-push (reads refs on stdin)
//
// Works with Node >= 18 on Linux, macOS, and Windows (Git Bash or PowerShell).
// Dependencies: git, gitleaks (https://github.com/gitleaks/gitleaks#installing).

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ZERO = /^0+$/;
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', maxBuffer: 1 << 30, ...opts });
  return r;
}
function git(...a) {
  const r = run('git', a);
  if (r.status !== 0) throw new Error(`git ${a.join(' ')} failed: ${r.stderr || r.error}`);
  return r.stdout;
}
// Text with line endings normalized to \n and a UTF-8 BOM dropped (Windows
// checkouts with core.autocrlf=true, editors that save CRLF or a BOM).
function normEol(text) {
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}
function die(msg) {
  console.error(msg);
  process.exit(1);
}

const top = git('rev-parse', '--show-toplevel').trim();
process.chdir(top);
const repo = (() => {
  const r = run('git', ['remote', 'get-url', 'origin']);
  const url = r.status === 0 ? r.stdout.trim() : '';
  const base = url ? url.replace(/\/+$/, '').split(/[/:]/).pop() : path.basename(top);
  return base.replace(/\.git$/, '');
})();

// ---------- denylist / allowlist ----------
function findDenylist() {
  if (process.env.PUBLIC_SAFE_DENYLIST) return process.env.PUBLIC_SAFE_DENYLIST;
  const cfg = run('git', ['config', '--get', 'publicsafe.denylist']);
  if (cfg.status === 0 && cfg.stdout.trim()) return cfg.stdout.trim();
  const parent = path.dirname(top);
  try {
    for (const d of readdirSync(parent, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const p = path.join(parent, d.name, 'public-safe', 'denylist.txt');
      if (existsSync(p)) return p;
    }
  } catch {
    // unreadable parent dir: fall through to fail-closed
  }
  return null;
}

// One regex per line. Blank lines and lines starting with # are ignored.
// A leading (?i) makes that line case-insensitive. Default is case-sensitive.
function loadPatterns(file) {
  const out = [];
  normEol(readFileSync(file, 'utf8'))
    .split('\n')
    .forEach((line, i) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      let src = t;
      let flags = '';
      if (src.startsWith('(?i)')) {
        src = src.slice(4);
        flags = 'i';
      }
      try {
        out.push({ re: new RegExp(src, flags), src: t, line: i + 1 });
      } catch (e) {
        die(`check:public-safe FAIL ${repo}: bad regex in ${file}:${i + 1}: ${e.message}`);
      }
    });
  return out;
}

const denyPath = findDenylist();
if (!denyPath || !existsSync(denyPath)) {
  die(
    [
      `check:public-safe FAIL ${repo}: private denylist not found (fail closed).`,
      '  Clone the private overlay next to this repo (it carries public-safe/denylist.txt),',
      '  or set PUBLIC_SAFE_DENYLIST=/abs/path/denylist.txt,',
      '  or git config publicsafe.denylist /abs/path/denylist.txt.',
    ].join('\n'),
  );
}
const deny = loadPatterns(denyPath);
if (deny.length === 0) die(`check:public-safe FAIL ${repo}: denylist ${denyPath} is empty (fail closed).`);
const allowPath = path.join(path.dirname(denyPath), 'allowlist.txt');
// Allowlist lines are regexes tested against "<repo>:<path>:<text>".
const allow = existsSync(allowPath) ? loadPatterns(allowPath) : [];

function denyHits(where, text) {
  const hits = [];
  for (const p of deny) {
    if (!p.re.test(text)) continue;
    const key = `${repo}:${where}:${text}`;
    if (allow.some((a) => a.re.test(key))) continue;
    hits.push({ where, text: text.trim().slice(0, 200), rule: `denylist:${p.line}` });
  }
  return hits;
}

// ---------- range scanning ----------
// revs: array of git rev args (e.g. ["A..B"] or [sha, "--not", "--remotes"])
function commitsIn(revs) {
  const out = git('rev-list', ...revs).trim();
  return out ? out.split('\n') : [];
}

function scanDenylistRange(revs) {
  const hits = [];
  // commit messages
  const msgs = normEol(git('log', '--format=%x00%H%n%B', ...revs));
  for (const block of msgs.split('\0').filter(Boolean)) {
    const [sha, ...body] = block.split('\n');
    for (const l of body) if (l.trim()) hits.push(...denyHits(`commit ${sha.slice(0, 7)} message`, l));
  }
  // added lines + new paths, per commit (catches text added then removed later)
  const patch = normEol(git('log', '-p', '-U0', '--no-color', '--no-ext-diff', '--format=%x00%H', '--diff-merges=first-parent', ...revs));
  let sha = '';
  let file = '';
  for (const l of patch.split('\n')) {
    if (l.startsWith('\0')) {
      sha = l.slice(1, 8);
      continue;
    }
    if (l.startsWith('+++ ')) {
      file = l.slice(4).replace(/^b\//, '');
      if (file !== '/dev/null') hits.push(...denyHits(`${sha} path`, file));
      continue;
    }
    if (l.startsWith('rename to ')) {
      hits.push(...denyHits(`${sha} path`, l.slice(10)));
      continue;
    }
    if (l.startsWith('+') && !l.startsWith('+++')) hits.push(...denyHits(`${sha} ${file}`, l.slice(1)));
  }
  return hits;
}

function scanTree() {
  const hits = [];
  const files = git('ls-files', '-z').split('\0').filter(Boolean);
  for (const f of files) {
    hits.push(...denyHits('path', f));
    let buf;
    try {
      buf = readFileSync(f);
    } catch {
      continue;
    }
    if (buf.includes(0)) continue; // binary
    normEol(buf.toString('utf8'))
      .split('\n')
      .forEach((l, i) => hits.push(...denyHits(`${f}:${i + 1}`, l)));
  }
  return hits;
}

function gitleaks(logOpts) {
  const probe = run('gitleaks', ['version']);
  if (probe.error || probe.status !== 0) {
    die(
      [
        `check:public-safe FAIL ${repo}: gitleaks not installed (fail closed).`,
        '  macOS: brew install gitleaks   Windows: winget install gitleaks  (or scoop install gitleaks)',
        '  Linux: download a release from https://github.com/gitleaks/gitleaks/releases',
      ].join('\n'),
    );
  }
  const dir = mkdtempSync(path.join(os.tmpdir(), 'public-safe-'));
  const report = path.join(dir, 'gitleaks.json');
  const gArgs = ['git', '.', '--no-banner', '--redact', '--exit-code', '1', '--report-format', 'json', '--report-path', report];
  if (logOpts) gArgs.push(`--log-opts=${logOpts}`);
  const r = run('gitleaks', gArgs);
  let findings = [];
  try {
    findings = JSON.parse(readFileSync(report, 'utf8'));
  } catch {
    // no report written
  }
  rmSync(dir, { recursive: true, force: true });
  if (r.status !== 0 && r.status !== 1) die(`check:public-safe FAIL ${repo}: gitleaks error\n${r.stderr}`);
  return findings.map((f) => ({
    where: `${(f.Commit || '').slice(0, 7)} ${f.File}:${f.StartLine}`,
    text: `${f.RuleID} ${f.Match || ''}`.slice(0, 200),
    rule: 'gitleaks',
  }));
}

function report(label, tip, leaks, hits) {
  const short = tip ? tip.slice(0, 7) : 'HEAD';
  if (leaks.length === 0 && hits.length === 0) {
    console.log(`check:public-safe PASS ${repo}@${short} (gitleaks 0, denylist 0)`);
    return true;
  }
  for (const h of [...leaks, ...hits]) console.error(`  [${h.rule}] ${h.where}: ${h.text}`);
  console.error(`check:public-safe FAIL ${repo}@${short} (gitleaks ${leaks.length}, denylist ${hits.length})${label ? ` ${label}` : ''}`);
  console.error('  Fix the content, or add a justified line to the private allowlist.txt next to the denylist.');
  return false;
}

function checkRevs(revs, tip, label) {
  if (commitsIn(revs).length === 0) {
    console.log(`check:public-safe PASS ${repo}@${tip.slice(0, 7)} (gitleaks 0, denylist 0) [no new commits]`);
    return true;
  }
  const leaks = gitleaks(revs.join(' '));
  const hits = scanDenylistRange(revs);
  return report(label, tip, leaks, hits);
}

function defaultBase() {
  for (const ref of ['refs/remotes/origin/HEAD', 'refs/remotes/origin/main', 'refs/remotes/origin/master']) {
    if (run('git', ['rev-parse', '--verify', '-q', ref]).status === 0) return ref.replace('refs/remotes/', '');
  }
  return null;
}

// ---------- main ----------
let ok = true;
if (flag('--pre-push')) {
  const stdin = normEol(readFileSync(0, 'utf8'));
  for (const line of stdin.split('\n').filter(Boolean)) {
    const [localRef, localSha, , remoteSha] = line.split(/\s+/);
    if (!localSha || ZERO.test(localSha)) continue; // branch delete
    // Everything reachable from what we push that no remote-tracking ref has yet.
    const revs = [localSha, '--not', '--remotes'];
    if (remoteSha && !ZERO.test(remoteSha) && run('git', ['cat-file', '-e', `${remoteSha}^{commit}`]).status === 0) {
      revs.push(remoteSha);
    }
    ok = checkRevs(revs, localSha, localRef) && ok;
  }
} else if (flag('--tree')) {
  const tip = git('rev-parse', 'HEAD').trim();
  ok = report('(tree)', tip, [], scanTree());
} else {
  const tip = git('rev-parse', 'HEAD').trim();
  const range = opt('--range');
  const base = opt('--base') || defaultBase();
  if (range) ok = checkRevs([range], git('rev-parse', range.split('..').pop() || 'HEAD').trim(), range);
  else if (base) ok = checkRevs([`${base}..HEAD`], tip, `${base}..HEAD`);
  else ok = checkRevs(['HEAD'], tip, '(all history)');
}
process.exit(ok ? 0 : 1);
