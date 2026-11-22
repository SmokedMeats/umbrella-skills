#!/usr/bin/env node
// One-command install: the outside packs at their newest release, then this overlay
// (and umbrella-swarm) on top, into every agent's skills folder.
//
//   git clone https://github.com/SmokedMeats/umbrella-skills.git && node umbrella-skills/scripts/install.mjs
//
// 1. Fetch Matt Pocock's skills (newest release tag), SimpleEnglish (HEAD) and the two
//    pstack skills the overlay calls (cursor/plugins HEAD) from their own repos into
//    .upstream/ (gitignored). A private clone with vendor/ installs its pinned copies instead.
// 2. Clone umbrella-swarm next to this folder when it is missing (--no-swarm skips).
// 3. Run sync-workspace.mjs: upstream skills first, then the overlay, so same-named
//    overlay skills win. A public clone gets --public. Other flags pass through.
//
// Needs git and Node 18+. Writes only .upstream/, the sibling swarm clone, and the
// skills folders sync writes (~/.claude/skills, ~/.cursor/skills, ...).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UPSTREAMS, ROUTED_UPSTREAM_SKILLS, layoutUpstream, newestSemverTag } from './upstreams.mjs';

const packRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  console.log('Usage: node scripts/install.mjs [--no-swarm] [sync-workspace flags...]');
  console.log('Installs the newest Matt Pocock skills, SimpleEnglish and the pstack skills this overlay calls,');
  console.log('then this overlay and umbrella-swarm on top. Other flags go to scripts/sync-workspace.mjs.');
  process.exit(0);
}

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', stdio: opts.inherit ? 'inherit' : 'pipe', cwd: opts.cwd });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${cmdArgs.join(' ')} failed${r.stderr ? `: ${r.stderr.trim()}` : ''}`);
  }
  return r.stdout || '';
}

function newestTag(repo) {
  const refs = run('git', ['ls-remote', '--tags', '--refs', repo]).split('\n').map((line) => line.split('refs/tags/')[1]);
  return newestSemverTag(refs);
}

// Bring a sibling clone up to date so sync's freshness check passes on a re-run.
// A folder that is not a git checkout (an archive copy) is left as it is.
function pullIfClone(dir) {
  if (spawnSync('git', ['-C', dir, 'rev-parse', '--git-dir'], { encoding: 'utf8' }).status !== 0) return;
  if (spawnSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', '@{u}'], { encoding: 'utf8' }).status !== 0) return;
  const r = spawnSync('git', ['-C', dir, 'pull', '-q', '--ff-only'], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`install: could not update ${dir} (${(r.stderr || '').trim()}).`);
    console.error('install: commit or stash local changes there, or pull it by hand, then run again.');
    process.exit(1);
  }
}

function fetchUpstream(upstream, dir) {
  const cloneArgs = ['clone', '-q', '--depth', '1'];
  const tag = upstream.ref === 'latest-tag' ? newestTag(upstream.repo) : null;
  if (tag) cloneArgs.push('--branch', tag);
  if (upstream.path) cloneArgs.push('--filter=blob:none', '--sparse');
  run('git', [...cloneArgs, upstream.repo, dir]);
  if (upstream.path) run('git', ['-C', dir, 'sparse-checkout', 'set', upstream.path]);
  const sha = run('git', ['-C', dir, 'rev-parse', '--short', 'HEAD']).trim();
  return tag ? `${tag} (${sha})` : sha;
}

const syncArgs = args.filter((a) => a !== '--no-swarm');
const env = { ...process.env };

pullIfClone(packRoot);

if (existsSync(path.join(packRoot, 'vendor'))) {
  console.log('Upstream packs: pinned copies in vendor/ (private clone)');
} else {
  const out = path.join(packRoot, '.upstream');
  rmSync(out, { recursive: true, force: true });
  const work = mkdtempSync(path.join(tmpdir(), 'umbrella-install-'));
  try {
    for (const upstream of UPSTREAMS) {
      const src = path.join(work, upstream.name);
      const version = fetchUpstream(upstream, src);
      layoutUpstream(upstream, src, path.join(out, upstream.name));
      console.log(`Upstream ${upstream.name}: ${upstream.repo} @ ${version}`);
      if (upstream.name === 'mattpocock-skills' && /^v?([2-9]|\d{2,})\./.test(version)) {
        console.log('  note: this overlay is written against Matt v1.x; a new major release may change skills it routes to.');
      }
    }
    const missing = ROUTED_UPSTREAM_SKILLS.filter((name) => !UPSTREAMS.some((u) => existsSync(path.join(out, u.name, 'skills', name, 'SKILL.md'))));
    if (missing.length) {
      throw new Error(`the newest upstream releases no longer ship skills this overlay calls: ${missing.join(', ')}. Open an issue on SmokedMeats/umbrella-skills`);
    }
  } catch (e) {
    console.error(`install: could not fetch the upstream packs: ${e.message}`);
    console.error('install: nothing was installed. Check your network (behind a proxy, set HTTPS_PROXY) and run again.');
    process.exit(1);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  env.UMBRELLA_VENDOR_ROOT = out;
}

const swarmDir = path.join(path.dirname(packRoot), 'umbrella-swarm');
if (args.includes('--no-swarm')) {
  syncArgs.push('--no-swarm');
} else if (!existsSync(swarmDir)) {
  console.log(`Cloning umbrella-swarm into ${swarmDir}`);
  try {
    run('git', ['clone', '-q', 'https://github.com/SmokedMeats/umbrella-swarm.git', swarmDir]);
  } catch (e) {
    console.error(`install: could not clone umbrella-swarm: ${e.message}`);
    console.error('install: nothing was installed. Check your network and run again, or add --no-swarm.');
    process.exit(1);
  }
} else {
  pullIfClone(swarmDir);
}

// The public snapshot has neither vendor/ nor the private binding. A private clone keeps
// vendor/, so a lost binding there still runs sync's source check and fails closed.
const isPublic = !existsSync(path.join(packRoot, 'vendor'))
  && !existsSync(path.join(packRoot, 'skills', 'umbrella', 'private-bindings.md'));
if (isPublic && !syncArgs.includes('--public')) syncArgs.unshift('--public');

const r = spawnSync(process.execPath, [path.join(packRoot, 'scripts', 'sync-workspace.mjs'), ...syncArgs], { stdio: 'inherit', env });
if (r.status === 0) {
  console.log('');
  console.log('Installed. Next, in each repo you want to use it in: run /setup-matt-pocock-skills once in your agent,');
  console.log('copy project.example.yml to docs/agents/project.yml and fill it in, then run /umbrella. See README "First run".');
}
process.exit(r.status ?? 1);
