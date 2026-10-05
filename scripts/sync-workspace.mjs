/**
 * Copy this overlay into user-global skill dirs and every workspace
 * product repo that sits next to this clone. Optionally layer a private
 * project overlay (a sibling clone; see findOverlaySibling) for bindings.
 *
 *   node scripts/sync-workspace.mjs                 # user roots + workspace.skill_targets
 *
 * User roots (always): ~/.grok/skills, ~/.cursor/skills, ~/.claude/skills,
 * ~/.agents/skills, ~/.copilot/skills (created when missing).
 *   node scripts/sync-workspace.mjs --box           # + Grok Bot box skills root (BOX_SKILLS_ROOT)
 *   node scripts/sync-workspace.mjs --dest <dir>    # + any extra skills root (repeatable)
 *   node scripts/sync-workspace.mjs --no-swarm      # skip the umbrella-swarm companion pack
 *
 * Swarm companion (when a sibling clone ships skills/swarm/SKILL.md +
 * skills/swarm-mode/SKILL.md, e.g. ../umbrella-swarm; UMBRELLA_SWARM=<folder>
 * picks one explicitly): every skill folder under its skills/ is copied into the
 * user roots and --box/--dest roots too, so one command installs both packs.
 * A swarm skill that shares a name with an overlay skill is skipped (v1 wins).
 *
 * Every skills root it writes gets the overlay skill folders (umbrella/ carries
 * PROJECT-CONFIG.md) and, with the private overlay present, project.yml +
 * standing-product-rules.md at the root.
 *
 * Overlay = conductor + planning overlays + understand/rigor imports.
 * Replaces only those skill folders. Other project skills stay.
 *
 * Private overlay (when ../<overlay_pack> exists):
 *   1. project.yml → each skill dest root + each product repo docs/agents/
 *   2. skills-overlay/** deep-merged onto matching skill folders
 *   3. docs/standing-product-rules.md → each skill dest root + product repos docs/agents/
 *   4. areas.yml + swarm goal docs → primary repo docs/swarm/
 *
 * check:public-safe (every sibling clone that ships .githooks/pre-push +
 * scripts/check-public-safe.mjs):
 *   - git config core.hooksPath .githooks
 *   - git config publicsafe.denylist <overlay>/public-safe/denylist.txt
 *   - warns when gitleaks is missing (the hook fails closed without it)
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OVERLAY_SKILLS = [
  'code-review',
  'grill-me',
  'grilling',
  'implement',
  'to-spec',
  'to-tickets',
  'triage',
  'umbrella',
  'umbrella-mode',
  'build-verifier',
  'device-qa-verifier',
  'wayfinder',
  'how',
  'why',
  'teach',
  'teach-me',
  'principles',
  'blast-radius',
];

const USER_SKILL_DIRS = ['.grok/skills', '.cursor/skills', '.claude/skills', '.agents/skills', '.copilot/skills'];

// Grok Bot box: skills (workflows) live in one flat root, not under ~/.grok.
const BOX_SKILLS_ROOT = '/home/box/agent-data/workflows';

const argv = process.argv.slice(2);
const EXTRA_DESTS = []; // { dir, box }
let SYNC_SWARM = true;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--box') EXTRA_DESTS.push({ dir: process.env.UMBRELLA_BOX_SKILLS_ROOT || BOX_SKILLS_ROOT, box: true });
  else if (a === '--dest' && argv[i + 1]) EXTRA_DESTS.push({ dir: path.resolve(argv[++i]), box: false });
  else if (a.startsWith('--dest=')) EXTRA_DESTS.push({ dir: path.resolve(a.slice('--dest='.length)), box: false });
  else if (a === '--no-swarm') SYNC_SWARM = false;
  else if (a === '-h' || a === '--help') {
    console.log('Usage: node scripts/sync-workspace.mjs [--box] [--dest <skills-root>]... [--no-swarm]');
    console.log(`  --box          also sync the Grok Bot box skills root (${BOX_SKILLS_ROOT}; override with UMBRELLA_BOX_SKILLS_ROOT)`);
    console.log('  --dest <dir>   also sync any other skills root (repeatable)');
    console.log('  --no-swarm     skip the swarm companion pack (sibling with skills/swarm + skills/swarm-mode)');
    console.log('  UMBRELLA_SWARM=<folder>    pick the swarm companion sibling explicitly');
    console.log('  UMBRELLA_OVERLAY=<folder>  pick the private overlay sibling explicitly');
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${a} (try --help)`);
    process.exit(2);
  }
}

// Read a text file with line endings normalized to \n (and a UTF-8 BOM dropped).
// Windows clones with core.autocrlf=true check config files out with CRLF; the
// line-based regexes below must see the same text on every OS.
function readText(p) {
  return readFileSync(p, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

const here = path.dirname(fileURLToPath(import.meta.url));
const packRoot = path.resolve(here, '..');
const srcRoot = path.join(packRoot, 'skills');
const workspaceRoot = path.resolve(packRoot, '..');

// The private overlay is a sibling clone whose project.yml names itself in
// `workspace.overlay_pack`. The public pack never hard-codes its name.
// UMBRELLA_OVERLAY=<dir name> picks one explicitly.
function findOverlaySibling() {
  if (process.env.UMBRELLA_OVERLAY) return process.env.UMBRELLA_OVERLAY;
  for (const ent of readdirSync(workspaceRoot, { withFileTypes: true })) {
    if (!ent.isDirectory() || path.join(workspaceRoot, ent.name) === packRoot) continue;
    const p = path.join(workspaceRoot, ent.name, 'project.yml');
    if (!existsSync(p)) continue;
    const m = readText(p).match(/overlay_pack:\s*(\S+)/);
    if (m && m[1].trim() === ent.name) return ent.name;
  }
  return null;
}

const overlaySibling = findOverlaySibling();

// The swarm companion pack is a sibling clone that ships skills/swarm and
// skills/swarm-mode. UMBRELLA_SWARM=<dir name or path> picks one explicitly;
// otherwise a folder named umbrella-swarm wins, then the first match by name.
function isSwarmPack(dir) {
  return ['swarm', 'swarm-mode'].every((n) => existsSync(path.join(dir, 'skills', n, 'SKILL.md')));
}

function findSwarmSibling() {
  if (process.env.UMBRELLA_SWARM) {
    const dir = path.resolve(workspaceRoot, process.env.UMBRELLA_SWARM);
    if (!isSwarmPack(dir)) throw new Error(`UMBRELLA_SWARM=${process.env.UMBRELLA_SWARM}: no skills/swarm + skills/swarm-mode in ${dir}`);
    return dir;
  }
  const names = readdirSync(workspaceRoot, { withFileTypes: true })
    .filter((ent) => ent.isDirectory() && path.join(workspaceRoot, ent.name) !== packRoot)
    .map((ent) => ent.name)
    .filter((name) => isSwarmPack(path.join(workspaceRoot, name)))
    .sort((a, b) => (a === 'umbrella-swarm' ? -1 : b === 'umbrella-swarm' ? 1 : a.localeCompare(b)));
  return names.length ? path.join(workspaceRoot, names[0]) : null;
}

function listSwarmSkills(swarmRoot) {
  const skillsDir = path.join(swarmRoot, 'skills');
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((ent) => ent.isDirectory() && existsSync(path.join(skillsDir, ent.name, 'SKILL.md')))
    .map((ent) => ent.name)
    .sort();
}

function copySwarmInto(destRoot, swarmRoot, names) {
  mkdirSync(destRoot, { recursive: true });
  for (const name of names) {
    const to = path.join(destRoot, name);
    rmSync(to, { recursive: true, force: true });
    cpSync(path.join(swarmRoot, 'skills', name), to, { recursive: true });
  }
}

function loadProjectConfig() {
  const candidates = [
    path.join(packRoot, 'project.yml'),
    overlaySibling && path.join(workspaceRoot, overlaySibling, 'project.yml'),
    path.join(packRoot, 'project.example.yml'),
  ].filter(Boolean);
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    // Minimal YAML subset: we only need workspace.skill_targets and overlay_pack.
    // Prefer adjacent private overlay when present.
    return { path: p, raw: readText(p) };
  }
  return null;
}

function parseSkillTargets(raw) {
  // Extremely small parser for:
  //   skill_targets:
  //     - { name: Foo, dirs: [.cursor/skills] }
  const targets = [];
  const block = raw.match(/skill_targets:\s*\n((?:[ \t]+-.+\n?)+)/);
  if (!block) {
    // Fallback: empty — user-global only
    return targets;
  }
  for (const line of block[1].split('\n')) {
    const m = line.match(/name:\s*([^,}\s]+).*dirs:\s*\[([^\]]*)\]/);
    if (!m) continue;
    const name = m[1].trim();
    const dirs = m[2].split(',').map((s) => s.trim()).filter(Boolean);
    targets.push({ repo: name, dirs });
  }
  return targets;
}

function parseOverlayPack(raw) {
  const m = raw.match(/overlay_pack:\s*(\S+)/);
  return m ? m[1].trim() : overlaySibling;
}

function parsePrimaryRepo(raw) {
  const m = raw.match(/-\s*\{\s*name:\s*([^,}\s]+).*kind:\s*primary/) ||
    raw.match(/name:\s*(\S+)\s*\n\s*kind:\s*primary/);
  if (m) return m[1].trim();
  const first = raw.match(/repos:\s*\n\s*-\s*name:\s*(\S+)/);
  return first ? first[1].trim() : null;
}

function copyOverlayInto(destRoot) {
  mkdirSync(destRoot, { recursive: true });
  for (const name of OVERLAY_SKILLS) {
    const from = path.join(srcRoot, name);
    const to = path.join(destRoot, name);
    if (!existsSync(from)) {
      throw new Error(`Missing overlay skill: ${from}`);
    }
    rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
  }
}

function deepMergeDir(fromRoot, toRoot) {
  if (!existsSync(fromRoot)) return;
  mkdirSync(toRoot, { recursive: true });
  for (const ent of readdirSync(fromRoot, { withFileTypes: true })) {
    const from = path.join(fromRoot, ent.name);
    const to = path.join(toRoot, ent.name);
    if (ent.isDirectory()) {
      deepMergeDir(from, to);
    } else {
      mkdirSync(path.dirname(to), { recursive: true });
      cpSync(from, to);
    }
  }
}

function label(p) {
  return p.replaceAll('\\', '/');
}

function copyFile(from, to) {
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to);
}

if (!existsSync(srcRoot)) {
  throw new Error(`No skills/ next to this script: ${srcRoot}`);
}

const present = new Set(readdirSync(srcRoot));
const missing = OVERLAY_SKILLS.filter((name) => !present.has(name));
if (missing.length > 0) {
  throw new Error(`Pack is missing overlay folders: ${missing.join(', ')}`);
}

const cfg = loadProjectConfig();
const cfgRaw = cfg ? cfg.raw : '';
const WORKSPACE_TARGETS = cfg ? parseSkillTargets(cfgRaw) : [];
const overlayPackName = (cfg && parseOverlayPack(cfgRaw)) || overlaySibling;
const privateRoot = overlayPackName ? path.join(workspaceRoot, overlayPackName) : null;
const hasPrivate = Boolean(privateRoot && existsSync(privateRoot));

console.log(`Pack: ${label(packRoot)}`);
if (cfg) console.log(`Config: ${label(cfg.path)}`);
if (hasPrivate) console.log(`Private overlay: ${label(privateRoot)}`);
else console.log(`Private overlay: (none${overlayPackName ? ` at ../${overlayPackName}` : ' found'})`);

const skillDests = [];

for (const rel of USER_SKILL_DIRS) {
  const dest = path.join(homedir(), rel);
  copyOverlayInto(dest);
  skillDests.push(dest);
  console.log(`  user  ${label(dest)}`);
}

for (const { repo, dirs } of WORKSPACE_TARGETS) {
  const repoRoot = path.join(workspaceRoot, repo);
  if (!existsSync(repoRoot)) {
    console.log(`  skip  ${repo} (not next to this clone)`);
    continue;
  }
  for (const rel of dirs) {
    const dest = path.join(repoRoot, rel);
    copyOverlayInto(dest);
    skillDests.push(dest);
    console.log(`  repo  ${repo}/${rel}`);
  }
}

for (const { dir: dest, box } of EXTRA_DESTS) {
  // --box on a machine without the box layout: skip instead of inventing /home/box.
  if (box && !existsSync(path.dirname(dest))) {
    console.log(`  skip  ${label(dest)} (--box: parent folder missing; not the Grok Bot box?)`);
    continue;
  }
  copyOverlayInto(dest);
  skillDests.push(dest);
  console.log(`  extra ${label(dest)}`);
}

// Swarm companion: user roots + --box/--dest roots (not product repo skill_targets).
// Runs before the private skills-overlay merge so the overlay can patch swarm skills too.
const swarmRoot = SYNC_SWARM ? findSwarmSibling() : null;
if (!SYNC_SWARM) {
  console.log('Swarm pack: (skipped, --no-swarm)');
} else if (!swarmRoot) {
  console.log('Swarm pack: (none found; clone umbrella-swarm next to this pack to include it)');
} else {
  const all = listSwarmSkills(swarmRoot);
  const clash = all.filter((n) => OVERLAY_SKILLS.includes(n));
  const names = all.filter((n) => !OVERLAY_SKILLS.includes(n));
  console.log(`Swarm pack: ${label(swarmRoot)} (${names.join(', ')})`);
  if (clash.length) console.log(`  swarm WARNING: skipped ${clash.join(', ')} (same name as an overlay skill; v1 wins)`);
  const swarmDests = [
    ...USER_SKILL_DIRS.map((rel) => path.join(homedir(), rel)),
    ...skillDests.filter((d) => EXTRA_DESTS.some((e) => path.resolve(e.dir) === path.resolve(d))),
  ];
  for (const dest of swarmDests) {
    copySwarmInto(dest, swarmRoot, names);
    console.log(`  pack  ${label(dest)}: swarm skills`);
  }
}

if (hasPrivate) {
  const privateProject = path.join(privateRoot, 'project.yml');
  const standing = path.join(privateRoot, 'docs', 'standing-product-rules.md');
  const skillsOverlay = path.join(privateRoot, 'skills-overlay');

  for (const dest of skillDests) {
    const wrote = [];
    if (existsSync(privateProject)) {
      copyFile(privateProject, path.join(dest, 'project.yml'));
      wrote.push('project.yml');
    }
    if (existsSync(standing)) {
      copyFile(standing, path.join(dest, 'standing-product-rules.md'));
      wrote.push('standing-product-rules.md');
    }
    if (existsSync(skillsOverlay)) {
      deepMergeDir(skillsOverlay, dest);
      wrote.push('skills-overlay/**');
    }
    if (wrote.length) console.log(`  cfg   ${label(dest)}: ${wrote.join(', ')}`);
  }

  for (const { repo, dirs } of WORKSPACE_TARGETS) {
    const repoRoot = path.join(workspaceRoot, repo);
    if (!existsSync(repoRoot)) continue;
    const agents = path.join(repoRoot, 'docs', 'agents');
    if (existsSync(privateProject)) {
      copyFile(privateProject, path.join(agents, 'project.yml'));
      console.log(`  cfg   ${repo}/docs/agents/project.yml`);
    }
    if (existsSync(standing)) {
      copyFile(standing, path.join(agents, 'standing-product-rules.md'));
      console.log(`  rules ${repo}/docs/agents/standing-product-rules.md`);
    }
  }

  // Swarm program-of-record → primary product repo docs/swarm/
  const primary = parsePrimaryRepo(cfgRaw) || (WORKSPACE_TARGETS[0] && WORKSPACE_TARGETS[0].repo);
  if (primary) {
    const primaryRoot = path.join(workspaceRoot, primary);
    if (existsSync(primaryRoot)) {
      const swarmDocs = path.join(primaryRoot, 'docs', 'swarm');
      mkdirSync(swarmDocs, { recursive: true });
      for (const rel of [
        'areas.yml',
        'docs/house-goals.md',
        'docs/milestone-goals.md',
        'docs/ticket-goals-log.md',
        'docs/PLAN.md',
      ]) {
        const from = path.join(privateRoot, rel);
        if (!existsSync(from)) continue;
        const base = path.basename(rel);
        copyFile(from, path.join(swarmDocs, base));
        console.log(`  swarm ${primary}/docs/swarm/${base}`);
      }
    }
  }
}

// check:public-safe: turn the local pre-push gate on in every sibling clone that ships it.
// Public repos carry .githooks/pre-push + scripts/check-public-safe.mjs; the denylist stays
// private in the overlay (public-safe/denylist.txt). No CI: this runs on the pushing machine.
function gitIn(repoRoot, ...args) {
  return spawnSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8' });
}
const denylist = hasPrivate ? path.join(privateRoot, 'public-safe', 'denylist.txt') : null;
const publicSafeRepos = [];
for (const ent of readdirSync(workspaceRoot, { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  const repoRoot = path.join(workspaceRoot, ent.name);
  if (!existsSync(path.join(repoRoot, '.githooks', 'pre-push'))) continue;
  if (!existsSync(path.join(repoRoot, 'scripts', 'check-public-safe.mjs'))) continue;
  if (gitIn(repoRoot, 'rev-parse', '--git-dir').status !== 0) continue;
  const current = gitIn(repoRoot, 'config', '--get', 'core.hooksPath').stdout.trim();
  if (current && current !== '.githooks') {
    console.log(`  hooks ${ent.name}: core.hooksPath is ${current}; left as is (set it to .githooks by hand)`);
    continue;
  }
  gitIn(repoRoot, 'config', 'core.hooksPath', '.githooks');
  if (denylist && existsSync(denylist)) gitIn(repoRoot, 'config', 'publicsafe.denylist', denylist);
  publicSafeRepos.push(ent.name);
  console.log(`  hooks ${ent.name}: core.hooksPath=.githooks (check:public-safe pre-push)`);
}
if (publicSafeRepos.length > 0) {
  if (!denylist || !existsSync(denylist)) {
    console.log('  hooks WARNING: no private public-safe/denylist.txt found; pushes from those clones will fail closed.');
  }
  const gl = spawnSync('gitleaks', ['version'], { encoding: 'utf8' });
  if (gl.error || gl.status !== 0) {
    console.log('  hooks WARNING: gitleaks not on PATH; the pre-push gate fails closed until it is installed:');
    console.log('    macOS: brew install gitleaks | Windows: winget install gitleaks (or scoop install gitleaks)');
    console.log('    Linux: release binary from https://github.com/gitleaks/gitleaks/releases');
  }
}

console.log(`Done. Overlay${swarmRoot ? ' + swarm pack' : ''} copied; other skills were left in place.`);
if (!hasPrivate) {
  console.log('Tip: clone your private overlay next to this pack to layer project.yml + standing rules.');
}
