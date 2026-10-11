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
 *   node scripts/sync-workspace.mjs --no-vendor     # skip the pinned Matt + SimpleEnglish snapshots
 *   node scripts/sync-workspace.mjs --no-personal   # skip mirroring personal skills across user roots
 *   node scripts/sync-workspace.mjs --no-rules      # skip each product repo's rules generator
 *   node scripts/sync-workspace.mjs --check-updates # upstream report + diffs (scripts/check-updates.mjs)
 *   node scripts/sync-workspace.mjs --update        # same, install the auto sources, then sync
 *
 * One command for every agent (Claude, Cursor, VS Code / Copilot, Grok, Codex, ...):
 *   1. pack skills (vendored + this overlay + swarm) -> user roots + each repo's skill dirs
 *   2. each repo's own skills (an original in `own: [...]` or any of its dirs) -> that repo's
 *      other skill dirs,
 *      then a skill only some repos have -> every other repo (a repo's own version wins;
 *      an agent-specific original, like graphify's .claude/skills copy, feeds that folder)
 *   3. personal skills (in a user root, not from a pack) -> the other user roots and every
 *      repo skill dir, so a cloud session with no home folder still has them
 *   4. each repo's rules generator (skill_targets `rules: "<command>"`, run in that repo)
 * Steps 2 and 3 write a marker file (.synced-by-sync-workspace) and only ever replace
 * a folder that carries it; a folder another installer owns is left alone.
 *
 * Vendored packs (vendor/<pack>/skills/<skill>, private clone only; the public snapshot
 * leaves vendor/ out): pinned, unedited copies of Matt's pack and SimpleEnglish
 * (vendor/README.md). They go to every root first, so an overlay skill of the
 * same name (grill-me, implement, teach, ...) still replaces Matt's.
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
  'device-qa-agent',
  'device-qa-verifier',
  'wayfinder',
  'how',
  'why',
  'teach',
  'teach-me',
  'principles',
  'blast-radius',
  'pit-of-success',
  'zero-tech-debt',
];

const USER_SKILL_DIRS = ['.grok/skills', '.cursor/skills', '.claude/skills', '.agents/skills', '.copilot/skills'];

// Grok Bot box: skills (workflows) live in one flat root, not under ~/.grok.
const BOX_SKILLS_ROOT = '/home/box/agent-data/workflows';

const argv = process.argv.slice(2);
const EXTRA_DESTS = []; // { dir, box }
let SYNC_SWARM = true;
let SYNC_VENDOR = true;
let SYNC_PERSONAL = true;
let SYNC_RULES = true;
let CHECK_UPDATES = false; // --check-updates: report + diffs, then stop
let APPLY_UPDATES = false; // --update: report + diffs, update auto sources, then sync
let PRINT_DIFFS = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--box') EXTRA_DESTS.push({ dir: process.env.UMBRELLA_BOX_SKILLS_ROOT || BOX_SKILLS_ROOT, box: true });
  else if (a === '--dest' && argv[i + 1]) EXTRA_DESTS.push({ dir: path.resolve(argv[++i]), box: false });
  else if (a.startsWith('--dest=')) EXTRA_DESTS.push({ dir: path.resolve(a.slice('--dest='.length)), box: false });
  else if (a === '--no-swarm') SYNC_SWARM = false;
  else if (a === '--no-vendor') SYNC_VENDOR = false;
  else if (a === '--no-personal') SYNC_PERSONAL = false;
  else if (a === '--no-rules') SYNC_RULES = false;
  else if (a === '--check-updates') CHECK_UPDATES = true;
  else if (a === '--update') APPLY_UPDATES = true;
  else if (a === '--print') PRINT_DIFFS = true;
  else if (a === '-h' || a === '--help') {
    console.log('Usage: node scripts/sync-workspace.mjs [--check-updates | --update [--print]] [--box] [--dest <skills-root>]... [--no-swarm] [--no-vendor] [--no-personal] [--no-rules]');
    console.log('  --check-updates  compare every upstream source with its newest release, write updates/<source>.diff; install nothing');
    console.log('  --update         same report, then install the auto sources (npx skills lock, graphify) and run the sync');
    console.log('  --print          also print every full diff (default: a summary per source; diffs saved in updates/)');
    console.log(`  --box          also sync the Grok Bot box skills root (${BOX_SKILLS_ROOT}; override with UMBRELLA_BOX_SKILLS_ROOT)`);
    console.log('  --dest <dir>   also sync any other skills root (repeatable)');
    console.log('  --no-swarm     skip the swarm companion pack (sibling with skills/swarm + skills/swarm-mode)');
    console.log('  --no-vendor    skip the pinned Matt + SimpleEnglish snapshots in vendor/');
    console.log('  --no-personal  skip mirroring personal skills across the user skill roots');
    console.log('  --no-rules     skip each product repo\'s rules generator (skill_targets rules:)');
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
  //     - { name: Foo, dirs: [.cursor/skills], own: [.grok/skills], rules: "node scripts/x.mjs", skip: [gh-mix] }
  // own, rules and skip are optional.
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
    const own = (line.match(/own:\s*\[([^\]]*)\]/)?.[1] || '').split(',').map((s) => s.trim()).filter(Boolean);
    const rules = line.match(/rules:\s*"([^"]*)"/)?.[1] || null;
    const skip = (line.match(/skip:\s*\[([^\]]*)\]/)?.[1] || '').split(',').map((s) => s.trim()).filter(Boolean);
    targets.push({ repo: name, dirs, own, rules, skip });
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

// Pinned upstream packs: vendor/<pack>/skills/<skill>/SKILL.md.
function listVendorSkills() {
  const root = path.join(packRoot, 'vendor');
  if (!existsSync(root)) return [];
  const out = [];
  for (const pack of readdirSync(root, { withFileTypes: true })) {
    const skills = path.join(root, pack.name, 'skills');
    if (!pack.isDirectory() || !existsSync(skills)) continue;
    for (const ent of readdirSync(skills, { withFileTypes: true })) {
      if (ent.isDirectory() && existsSync(path.join(skills, ent.name, 'SKILL.md'))) {
        out.push({ pack: pack.name, name: ent.name, from: path.join(skills, ent.name) });
      }
    }
  }
  return out;
}

const VENDOR_SKILLS = SYNC_VENDOR ? listVendorSkills() : [];

function copyOverlayInto(destRoot) {
  mkdirSync(destRoot, { recursive: true });
  // Vendored first, so the overlay's same-named skills replace Matt's below.
  for (const { name, from } of VENDOR_SKILLS) {
    const to = path.join(destRoot, name);
    rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
  }
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
if (CHECK_UPDATES || APPLY_UPDATES) {
  const { checkUpdates } = await import('./check-updates.mjs');
  const results = await checkUpdates({
    packRoot, workspaceRoot, targets: WORKSPACE_TARGETS, apply: APPLY_UPDATES, print: PRINT_DIFFS, label,
  });
  if (CHECK_UPDATES) process.exit(results.some((r) => r.status === 'error') ? 1 : 0);
  console.log('');
}
const overlayPackName = (cfg && parseOverlayPack(cfgRaw)) || overlaySibling;
const privateRoot = overlayPackName ? path.join(workspaceRoot, overlayPackName) : null;
const hasPrivate = Boolean(privateRoot && existsSync(privateRoot));

console.log(`Pack: ${label(packRoot)}`);
if (cfg) console.log(`Config: ${label(cfg.path)}`);
if (!SYNC_VENDOR) console.log('Vendored packs: (skipped, --no-vendor)');
else if (VENDOR_SKILLS.length) {
  const byPack = {};
  for (const v of VENDOR_SKILLS) byPack[v.pack] = (byPack[v.pack] || 0) + 1;
  console.log(`Vendored packs: ${Object.entries(byPack).map(([k, n]) => `${k} (${n})`).join(', ')}`);
} else {
  console.log('Vendored packs: (none in this clone; install Matt + SimpleEnglish with npx, README Install)');
}
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

// Swarm companion: every root the overlay went to (user roots, product repo skill_targets, --box/--dest),
// so a cloud coordinator or sibling working in a product checkout can read the swarm skills too.
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
  const swarmDests = [...new Set(skillDests.map((d) => path.resolve(d)))];
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

// ---------- steps 2-4: repo-own skills, personal skills, rules ----------
// A copy this script made carries MIRROR_MARKER. Only a missing folder or one that
// carries the marker (or the old sync:claude-skills marker) is ever replaced.
const MIRROR_MARKER = '.synced-by-sync-workspace';
const LEGACY_MARKERS = ['.synced-by-sync-claude-skills'];
const packOwned = new Set([
  ...OVERLAY_SKILLS,
  ...VENDOR_SKILLS.map((v) => v.name),
  ...(swarmRoot && SYNC_SWARM ? listSwarmSkills(swarmRoot) : []),
]);
const mirrorExclude = new Set(
  (cfgRaw.match(/mirror_exclude:\s*\[([^\]]*)\]/)?.[1] || '').split(',').map((s) => s.trim()).filter(Boolean),
);
let failures = 0;

function skillNames(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(path.join(root, e.name, 'SKILL.md')))
    .map((e) => e.name);
}
function isMirrorCopy(dir) {
  return [MIRROR_MARKER, ...LEGACY_MARKERS].some((m) => existsSync(path.join(dir, m)));
}
// Machine-independent source for the marker, so syncs on different machines write the same file.
function sourceNote(p) {
  const rel = (base, prefix) => {
    const r = path.relative(base, p);
    return r && !r.startsWith('..') && !path.isAbsolute(r) ? `${prefix}${r}` : null;
  };
  return label(rel(workspaceRoot, '') || rel(homedir(), '~/') || p);
}
function mirrorSkill(from, to, note) {
  if (existsSync(to) && !isMirrorCopy(to)) return false; // another installer owns it
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true, dereference: true });
  for (const m of LEGACY_MARKERS) rmSync(path.join(to, m), { force: true });
  writeFileSync(path.join(to, MIRROR_MARKER), `Copied by sync-workspace.mjs from ${note}. Edit the source, not this copy.\n`);
  return true;
}

// 2. Each product repo's own skills -> its other skill dirs. A source is any original
//    (not a pack skill, not a copy) in the row's own folders first, then in any of its
//    skill dirs, so a skill made in .cursor/skills reaches .grok and .claude too.
const refreshed = new Set(); // resolved dest folders written or confirmed this run
for (const { repo, dirs, own } of WORKSPACE_TARGETS) {
  const repoRoot = path.join(workspaceRoot, repo);
  if (!existsSync(repoRoot)) continue;
  const seen = new Set();
  const copied = [];
  const kept = [];
  for (const srcRel of [...new Set([...own, ...dirs])]) {
    for (const name of skillNames(path.join(repoRoot, srcRel))) {
      if (seen.has(name) || packOwned.has(name) || mirrorExclude.has(name)) continue;
      const from = path.join(repoRoot, srcRel, name);
      if (isMirrorCopy(from)) continue; // a copy this script made, not a source
      seen.add(name);
      for (const rel of dirs) {
        if (path.resolve(repoRoot, rel) === path.resolve(repoRoot, srcRel)) continue;
        const to = path.join(repoRoot, rel, name);
        if (mirrorSkill(from, to, `${repo}/${srcRel}/${name}`)) { copied.push(`${rel}/${name}`); refreshed.add(path.resolve(to)); }
        else kept.push(`${rel}/${name}`);
      }
    }
  }
  console.log(`  own   ${repo}: ${copied.length} copied between ${[...new Set([...own, ...dirs])].join(', ')}${kept.length ? `; left alone (another installer): ${kept.join(', ')}` : ''}`);
}

// 2b. A skill only some repos have -> every other repo too. An original is any skill
//     folder in a repo's own or skill dirs that is neither a pack skill nor a copy.
//     A repo that has its own original keeps it. Per folder, an original in that same
//     folder elsewhere wins (graphify's Claude-specific .claude/skills copy goes to
//     .claude/skills); otherwise the first repo's first own source (targets order).
//     A row's `skip: [...]` names skills that repo never receives, from other repos or
//     from personal skills (step 3); a copy left there earlier is removed (only a marked
//     copy, never the repo's own).
const repoOriginals = new Map(); // repo -> Map(name -> Map(rel -> dir))
for (const { repo, dirs, own } of WORKSPACE_TARGETS) {
  const repoRoot = path.join(workspaceRoot, repo);
  if (!existsSync(repoRoot)) continue;
  const found = new Map();
  for (const rel of [...new Set([...own, ...dirs])]) {
    for (const name of skillNames(path.join(repoRoot, rel))) {
      const dir = path.join(repoRoot, rel, name);
      if (packOwned.has(name) || mirrorExclude.has(name) || isMirrorCopy(dir)) continue;
      if (!found.has(name)) found.set(name, new Map());
      found.get(name).set(path.normalize(rel), dir);
    }
  }
  repoOriginals.set(repo, found);
}
const shared = new Map(); // name -> { first, byRel: Map(rel -> dir) }
for (const found of repoOriginals.values()) {
  for (const [name, byRel] of found) {
    if (!shared.has(name)) shared.set(name, { first: [...byRel.values()][0], byRel: new Map() });
    for (const [rel, dir] of byRel) if (!shared.get(name).byRel.has(rel)) shared.get(name).byRel.set(rel, dir);
  }
}
for (const { repo, dirs, skip } of WORKSPACE_TARGETS) {
  const found = repoOriginals.get(repo);
  if (!found) continue;
  const copied = [];
  const removed = [];
  for (const name of skip) {
    if (found.has(name)) continue; // the repo's own skill, not a shared copy
    for (const rel of dirs) {
      const dir = path.join(workspaceRoot, repo, rel, name);
      if (existsSync(dir) && isMirrorCopy(dir)) { rmSync(dir, { recursive: true, force: true }); removed.push(`${rel}/${name}`); }
    }
  }
  if (removed.length) console.log(`  skip  ${repo}: removed ${removed.length} earlier shared cop${removed.length === 1 ? 'y' : 'ies'} (${removed.join(', ')})`);
  for (const [name, { first, byRel }] of shared) {
    if (found.has(name) || skip.includes(name)) continue; // own version wins; skip never arrives
    for (const rel of dirs) {
      const from = byRel.get(path.normalize(rel)) || first;
      const to = path.join(workspaceRoot, repo, rel, name);
      if (mirrorSkill(from, to, sourceNote(from))) { copied.push(name); refreshed.add(path.resolve(to)); }
    }
  }
  const names = [...new Set(copied)];
  if (names.length) console.log(`  share ${repo}: ${names.length} skill(s) from other repos (${names.join(', ')})`);
}

// 3. Personal skills: any original skill in a user root (not a pack skill, not a copy)
//    goes to the other user roots and to every repo skill dir (minus that row's skip).
const repoSkipFor = new Map(); // repo skill dir -> that row's skip list
for (const { repo, dirs, skip } of WORKSPACE_TARGETS) {
  for (const rel of dirs) repoSkipFor.set(path.join(workspaceRoot, repo, rel), skip);
}
const repoSkillDirs = WORKSPACE_TARGETS.flatMap(({ repo, dirs }) =>
  existsSync(path.join(workspaceRoot, repo)) ? dirs.map((rel) => path.join(workspaceRoot, repo, rel)) : [],
);
// Originals only: a copy this script left in an own folder is not a repo skill.
const repoOwnNames = new Set(
  WORKSPACE_TARGETS.flatMap(({ repo, own, dirs }) =>
    [...new Set([...own, ...dirs])].flatMap((rel) =>
      skillNames(path.join(workspaceRoot, repo, rel)).filter(
        (name) => !isMirrorCopy(path.join(workspaceRoot, repo, rel, name)),
      ),
    ),
  ),
);
if (SYNC_PERSONAL) {
  const roots = USER_SKILL_DIRS.map((rel) => path.join(homedir(), rel));
  const sources = new Map(); // name -> first original (non-copy) folder
  for (const root of roots) {
    for (const name of skillNames(root)) {
      if (packOwned.has(name) || mirrorExclude.has(name) || sources.has(name)) continue;
      const dir = path.join(root, name);
      if (!isMirrorCopy(dir)) sources.set(name, dir);
    }
  }
  let n = 0;
  for (const [name, from] of sources) {
    const repoDests = repoOwnNames.has(name) ? [] : repoSkillDirs.filter((d) => !repoSkipFor.get(d)?.includes(name));
    const dests = [...roots, ...repoDests];
    for (const root of dests) {
      const to = path.join(root, name);
      if (path.resolve(to) === path.resolve(from)) continue;
      if (mirrorSkill(from, to, sourceNote(from))) { n++; refreshed.add(path.resolve(to)); }
    }
  }
  console.log(`Personal skills: ${sources.size} found, ${n} copies written to user roots and repo skill dirs (--no-personal skips)`);
} else {
  console.log('Personal skills: (skipped, --no-personal)');
}

// Copies this script made earlier whose source is gone from this machine. Not deleted:
// on a machine without your personal skills (a cloud session) that would wipe them.
const stale = [];
for (const root of [...USER_SKILL_DIRS.map((rel) => path.join(homedir(), rel)), ...repoSkillDirs]) {
  for (const name of skillNames(root)) {
    const dir = path.join(root, name);
    if (isMirrorCopy(dir) && !refreshed.has(path.resolve(dir)) && !packOwned.has(name)) stale.push(label(dir));
  }
}
if (stale.length && SYNC_PERSONAL) {
  console.log(`  stale ${stale.length} copied skill(s) whose source is not on this machine (left in place; delete by hand if retired):`);
  for (const s of stale) console.log(`    ${s}`);
}

// 4. Each product repo's rules generator.
for (const { repo, rules } of WORKSPACE_TARGETS) {
  const repoRoot = path.join(workspaceRoot, repo);
  if (!rules || !existsSync(repoRoot)) continue;
  if (!SYNC_RULES) {
    console.log(`  rules ${repo}: (skipped, --no-rules)`);
    continue;
  }
  const r = spawnSync(rules, { cwd: repoRoot, shell: true, encoding: 'utf8' });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').filter(Boolean);
  if (r.status === 0) {
    console.log(`  rules ${repo}: ${out.at(-1) || 'ok'}`);
  } else {
    failures++;
    console.error(`  rules ${repo}: FAILED (${rules}, exit ${r.status})`);
    for (const l of out.slice(-10)) console.error(`    ${l}`);
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

if (failures) {
  console.error(`Done with ${failures} failure(s) above.`);
  process.exitCode = 1;
} else {
  console.log(`Done. Overlay${swarmRoot ? ' + swarm pack' : ''} copied; other skills were left in place.`);
}
if (!hasPrivate) {
  console.log('Tip: clone your private overlay next to this pack to layer project.yml + standing rules.');
}
