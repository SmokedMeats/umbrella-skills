/**
 * Copy this overlay into user-global skill dirs and every workspace
 * product repo that sits next to this clone. Optionally layer a private
 * project overlay (a sibling clone; see findOverlaySibling) for bindings.
 *
 *   node scripts/sync-workspace.mjs                 # source pack: user roots + workspace.skill_targets
 *   node scripts/sync-workspace.mjs --public        # public snapshot install; explicit, never inferred
 *
 * User roots (always): ~/.grok/skills, ~/.cursor/skills, ~/.claude/skills,
 * ~/.agents/skills, ~/.copilot/skills (created when missing).
 *   node scripts/sync-workspace.mjs --box           # + Grok Bot box skills root (BOX_SKILLS_ROOT)
 *   node scripts/sync-workspace.mjs --dest <dir>    # + any extra skills root (repeatable)
 *   node scripts/sync-workspace.mjs --fixture-root <dir>
 *       # overlay skills only. Does not copy project.yml, standing rules,
 *       # skills-overlay, or swarm docs, and does not run personal mirror, rules, or hook config.
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
 * leaves vendor/ out): pinned, unedited copies of Matt's pack, SimpleEnglish, and the
 * pstack skills the overlay calls by name (vendor/README.md). They go to every root first, so an overlay skill of the
 * same name (grill-me, implement, teach, ...) still replaces Matt's.
 *
 * Swarm companion (when a sibling clone ships skills/swarmy/SKILL.md +
 * skills/swarmy-mode/SKILL.md, e.g. ../umbrella-swarm; UMBRELLA_SWARM=<folder>
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
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { closeSync, constants, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readlinkSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
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
  'tech-lead-review',
];

const USER_SKILL_DIRS = ['.grok/skills', '.cursor/skills', '.claude/skills', '.agents/skills', '.copilot/skills'];

// Skills a tool ships for itself. An older Grok Build copied its bundled skills into
// ~/.grok/skills, at the same bytes or as an older copy. A skill in a tool's own root
// whose name is in that tool's bundle, or on its retired list (an older release put it
// there and the bundle no longer ships it), is the tool's: sync does not mirror it as a
// personal skill and never overwrites it. A pack skill of the same name is reported as a
// known collision, not refused (#67).
const TOOL_OWN_SKILLS = [
  { tool: 'Grok Build', root: '.grok/skills', bundled: '.grok/bundled/skills', retired: ['check-work', 'help'] },
];
function toolOwnerOf(dir) {
  const parent = path.resolve(path.dirname(dir));
  const name = path.basename(dir);
  for (const { tool, root, bundled, retired } of TOOL_OWN_SKILLS) {
    if (path.resolve(homedir(), root) !== parent) continue;
    if (retired.includes(name) || existsSync(path.join(homedir(), bundled, name, 'SKILL.md'))) return tool;
  }
  return null;
}

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
let FORCE_UPDATES = false; // --force: --update installs even when the new version drops something
let FIXTURE_ROOT = ''; // --fixture-root: one disposable skills root; no user homes
let PUBLIC_SNAPSHOT = false; // --public: explicit public-snapshot check. Missing binding does not set this.
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
  else if (a === '--force') FORCE_UPDATES = true;
  else if (a === '--fixture-root' && argv[i + 1]) FIXTURE_ROOT = path.resolve(argv[++i]);
  else if (a.startsWith('--fixture-root=')) FIXTURE_ROOT = path.resolve(a.slice('--fixture-root='.length));
  else if (a === '--public') PUBLIC_SNAPSHOT = true;
  else if (a === '-h' || a === '--help') {
    console.log('Usage: node scripts/sync-workspace.mjs [--public] [--check-updates | --update [--print]] [--box] [--dest <skills-root>]... [--no-swarm] [--no-vendor] [--no-personal] [--no-rules]');
    console.log('  --public       public snapshot install. Runs the public shared-flow check (the binding file must be absent).');
    console.log('                 Explicit only: a missing binding file does not select this mode.');
    console.log('                 Default is the source pack and fails closed when skills/umbrella/private-bindings.md is missing.');
    console.log('  --check-updates  compare every upstream source with its newest release, write updates/<source>.diff; install nothing');
    console.log('  --update         same report, then install the auto sources (npx skills lock, graphify) and run the sync');
    console.log('  --print          also print every full diff (default: a summary per source; diffs saved in updates/)');
    console.log('  --force          with --update: install even a source whose new version drops a skill, file or section we have now');
    console.log(`  --box          also sync the Grok Bot box skills root (${BOX_SKILLS_ROOT}; override with UMBRELLA_BOX_SKILLS_ROOT)`);
    console.log('  --dest <dir>   also sync any other skills root (repeatable)');
    console.log('  --fixture-root <dir>  copy overlay skills into that directory only (no home, mirror, rules, hooks, project.yml, standing rules, skills-overlay, or swarm docs)');
    console.log('  --no-swarm     skip the swarm companion pack (sibling with skills/swarmy + skills/swarmy-mode)');
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
const workspaceRoot = FIXTURE_ROOT && process.env.UMBRELLA_FIXTURE_WORKSPACE
  ? path.resolve(process.env.UMBRELLA_FIXTURE_WORKSPACE)
  : path.resolve(packRoot, '..');

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

// The swarm companion pack is a sibling clone that ships skills/swarmy and
// skills/swarmy-mode. UMBRELLA_SWARM=<dir name or path> picks one explicitly;
// otherwise a folder named umbrella-swarm wins, then the first match by name.
function isSwarmPack(dir) {
  return ['swarmy', 'swarmy-mode'].every((n) => existsSync(path.join(dir, 'skills', n, 'SKILL.md')));
}

function findSwarmSibling() {
  if (process.env.UMBRELLA_SWARM) {
    const dir = path.resolve(workspaceRoot, process.env.UMBRELLA_SWARM);
    if (!isSwarmPack(dir)) throw new Error(`UMBRELLA_SWARM=${process.env.UMBRELLA_SWARM}: no skills/swarmy + skills/swarmy-mode in ${dir}`);
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

let swarmSkillNames = new Set();

function copySwarmInto(destRoot, swarmRoot, names, overlayRoot = '') {
  mkdirSync(destRoot, { recursive: true });
  let ok = true;
  for (const name of names) {
    const from = path.join(swarmRoot, 'skills', name);
    let overlayDir = '';
    if (overlayRoot) {
      const dir = path.join(overlayRoot, name);
      if (existsSync(dir) && lstatSync(dir).isDirectory()) overlayDir = dir;
    }
    if (!placePackSkill(from, path.join(destRoot, name), overlayDir)) ok = false;
  }
  return ok;
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
const packSkillNames = new Set([
  ...OVERLAY_SKILLS,
  ...VENDOR_SKILLS.map((v) => v.name),
]);
const PACK_BASELINE = '.sync-workspace-baseline';
// A copy this script made carries MIRROR_MARKER. Only a missing folder or one that
// carries the marker (or the old sync:claude-skills marker) is ever replaced.
const MIRROR_MARKER = '.synced-by-sync-workspace';
const LEGACY_MARKERS = ['.synced-by-sync-claude-skills'];
function isMirrorCopy(dir) {
  return [MIRROR_MARKER, ...LEGACY_MARKERS].some((m) => existsSync(path.join(dir, m)));
}

function treeHash(dir) {
  const hash = createHash('sha256');
  const walk = (rel) => {
    const abs = rel ? path.join(dir, rel) : dir;
    const entries = readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const ent of entries) {
      if (!rel && ent.name === PACK_BASELINE) continue;
      const child = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = path.join(dir, child);
      if (ent.isSymbolicLink()) {
        hash.update('symlink\0');
        hash.update(child);
        hash.update('\0');
        hash.update(readlinkSync(childAbs));
        hash.update('\0');
      } else if (ent.isDirectory()) {
        hash.update('dir\0');
        hash.update(child);
        hash.update('\0');
        if (!walk(child)) return false;
      } else if (ent.isFile()) {
        hash.update('file\0');
        hash.update(child);
        hash.update('\0');
        hash.update(readFileSync(childAbs));
        hash.update('\0');
      } else {
        return false;
      }
    }
    return true;
  };
  if (!walk('')) return null;
  return hash.digest('hex');
}

function baselineLstat(skillDir) {
  try {
    return lstatSync(path.join(skillDir, PACK_BASELINE));
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

// A symlink is not a baseline. writeFileSync would follow it and replace the
// file outside this skill. Open the path with O_NOFOLLOW so a link that appears
// after the lstat is a failed write, not an outside overwrite.
function recordPackBaseline(skillDir) {
  const existing = baselineLstat(skillDir);
  if (existing && !existing.isFile()) return false;
  const installed = treeHash(skillDir);
  if (installed === null) return false;
  const baselinePath = path.join(skillDir, PACK_BASELINE);
  const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW;
  let fd;
  try {
    fd = openSync(baselinePath, flags, 0o644);
  } catch (error) {
    if (error && (error.code === 'ELOOP' || error.code === 'EEXIST')) return false;
    throw error;
  }
  try {
    writeFileSync(fd, `${installed}\n`);
  } finally {
    closeSync(fd);
  }
  return true;
}

// Pack source plus that skill's overlay slice, when the slice exists. The
// comparison target is this installed result, not the pack directory alone.
function desiredSkill(from, overlayDir) {
  if (!overlayDir) return { root: from, cleanup() {} };
  const tmp = mkdtempSync(path.join(tmpdir(), 'sync-desired-'));
  const root = path.join(tmp, 'skill');
  cpSync(from, root, { recursive: true });
  deepMergeDir(overlayDir, root);
  return {
    root,
    cleanup() {
      rmSync(tmp, { recursive: true, force: true });
    },
  };
}

const refusedDestinations = new Set();
const LEGACY_MIRROR_NAMES = new Set(['swarm', 'swarm-mode']);

function refusePack(to, state) {
  refusedDestinations.add(path.resolve(to));
  console.error(`sync: refuse to replace ${label(to)} (${state}). Not deleted.`);
  return false;
}

// A tool's own built-in holds this pack skill's name in that tool's root. It stays
// byte-identical and gains no baseline; later steps skip the path. Not a failure.
const knownCollisions = new Set();
function knownCollision(to, tool) {
  const key = path.resolve(to);
  refusedDestinations.add(key);
  if (!knownCollisions.has(key)) {
    knownCollisions.add(key);
    console.log(`sync: known collision ${label(to)} is ${tool}'s own skill; the pack copy is not installed there (MAINTAINING.md, tool built-ins).`);
  }
  return true;
}

function installDesired(from, to) {
  rmSync(to, { recursive: true, force: true });
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  if (!recordPackBaseline(to)) return refusePack(to, 'unsupported');
  return true;
}

// absent: no directory entry at all. A symlink is not absent, including when
// its target is missing. Install only when lstat reports nothing there.
// an existing symlink or any other non-directory: refuse before any remove.
// The link text stays, and a missing target is not created.
// dest already equals that tree: write a missing baseline only. Do not replace.
// baseline matches dest and desired moved: replace. The previous bytes were ours.
// no baseline and dest equals the pack source exactly: install desired. An extra
// file would have changed the hash, so this replace does not drop a local edit.
// a baseline symlink, or any baseline that is not a regular file: refuse before
// any copy or write. The link and the file it names stay.
// anything else: differ (no baseline) or dirty (baseline mismatch). No write,
// and no baseline is created on differ.
function placePackSkill(from, to, overlayDir = '') {
  const desired = desiredSkill(from, overlayDir);
  try {
    const desiredHash = treeHash(desired.root);
    const packHash = treeHash(from);
    if (desiredHash === null || packHash === null) return refusePack(to, 'unsupported');
    let info = null;
    try {
      info = lstatSync(to);
    } catch (error) {
      if (!error || error.code !== 'ENOENT') throw error;
    }
    if (!info) {
      console.log(`sync: installed ${label(to)}`);
      return installDesired(desired.root, to);
    }
    if (!info.isDirectory()) return refusePack(to, 'not-a-directory');
    const baselineInfo = baselineLstat(to);
    if (baselineInfo && baselineInfo.isSymbolicLink()) return refusePack(to, 'baseline-link');
    if (baselineInfo && !baselineInfo.isFile()) return refusePack(to, 'unsupported');
    const destHash = treeHash(to);
    if (destHash === null) return refusePack(to, 'unsupported');
    const baseline = baselineInfo ? readFileSync(path.join(to, PACK_BASELINE), 'utf8').trim() : null;
    if (destHash === desiredHash) {
      if (baseline !== desiredHash && !recordPackBaseline(to)) return refusePack(to, 'unsupported');
      console.log(`sync: unchanged ${label(to)}`);
      return true;
    }
    if (baseline !== null && baseline === destHash) {
      console.log(`sync: updated ${label(to)}`);
      return installDesired(desired.root, to);
    }
    if (baseline === null && destHash === packHash) {
      console.log(`sync: updated ${label(to)}`);
      return installDesired(desired.root, to);
    }
    // A mirror copy this script wrote earlier, for a skill that is now a pack skill
    // (a personal skill that moved into vendor/ or the overlay). Its bytes were ours.
    if (baseline === null && isMirrorCopy(to)) {
      console.log(`sync: updated ${label(to)} (earlier mirror copy, now a pack skill)`);
      return installDesired(desired.root, to);
    }
    const tool = toolOwnerOf(to);
    if (tool) return knownCollision(to, tool);
    return refusePack(to, baseline === null ? 'differ' : 'dirty');
  } finally {
    desired.cleanup();
  }
}

// Each pack skill is decided on its own. A refusal does not undo an earlier
// skill in the same call; this is not a transaction. A directory is replaced
// only when no entry is there, when its baseline still matches, or when it has no
// baseline and its tree hash equals the pack source. A symlink is an entry.
// A tree that already matches the installed result, including its overlay slice, is not replaced.
// Symlink targets are part of that hash and are not followed. Anything else
// is left in place.
// --fixture-root returns before overlay project writes, repo-own copies, and repo share.
function copyOverlayInto(destRoot, overlayRoot = '') {
  mkdirSync(destRoot, { recursive: true });
  const overlaySlice = (name) => {
    if (!overlayRoot) return '';
    const dir = path.join(overlayRoot, name);
    return existsSync(dir) && lstatSync(dir).isDirectory() ? dir : '';
  };
  let ok = true;
  for (const { name, from } of VENDOR_SKILLS) {
    if (!placePackSkill(from, path.join(destRoot, name), overlaySlice(name))) ok = false;
  }
  for (const name of OVERLAY_SKILLS) {
    const from = path.join(srcRoot, name);
    if (!existsSync(from)) throw new Error(`Missing overlay skill: ${from}`);
    if (!placePackSkill(from, path.join(destRoot, name), overlaySlice(name))) ok = false;
  }
  return ok;
}

// Pack skills are already final, including their overlay slice. A refused pack
// skill stays as it was. Other overlay entries (swarm patches, extra files) still merge.
function applySkillsOverlay(dest, skillsOverlay) {
  let merged = false;
  for (const ent of readdirSync(skillsOverlay, { withFileTypes: true })) {
    if (packSkillNames.has(ent.name) || swarmSkillNames.has(ent.name)) continue;
    const from = path.join(skillsOverlay, ent.name);
    const to = path.join(dest, ent.name);
    if (refusedDestinations.has(path.resolve(to))) continue;
    if (ent.isDirectory()) deepMergeDir(from, to);
    else copyFile(from, to);
    merged = true;
  }
  return merged;
}
// The pre-sync check below stays before loadProjectConfig and before any write.
// copyOverlayInto still replaces only overlay skill folders. Mirror copies stay marker-gated.

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
{
  const { checkSteps, reportSteps } = await import('./check-steps.mjs');
  if (!reportSteps(checkSteps(packRoot))) process.exit(1);
  const { checkSharedFlow, reportSharedFlow } = await import('./check-shared-flow.mjs');
  const packMode = PUBLIC_SNAPSHOT ? 'public' : 'source';
  if (!reportSharedFlow(checkSharedFlow(packRoot, { packMode }))) process.exit(1);
}

const cfg = loadProjectConfig();
const cfgRaw = cfg ? cfg.raw : '';
const WORKSPACE_TARGETS = cfg ? parseSkillTargets(cfgRaw) : [];
if (CHECK_UPDATES || APPLY_UPDATES) {
  const { checkUpdates } = await import('./check-updates.mjs');
  const results = await checkUpdates({
    packRoot, workspaceRoot, targets: WORKSPACE_TARGETS, apply: APPLY_UPDATES, force: FORCE_UPDATES, print: PRINT_DIFFS, label,
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
let installRefused = 0;

const skillsOverlayRoot = hasPrivate && existsSync(path.join(privateRoot, 'skills-overlay'))
  ? path.join(privateRoot, 'skills-overlay')
  : '';

if (FIXTURE_ROOT) {
  if (!copyOverlayInto(FIXTURE_ROOT)) process.exit(1);
  const ownedSkill = path.join(FIXTURE_ROOT, 'wip-owned', 'SKILL.md');
  mkdirSync(path.dirname(ownedSkill), { recursive: true });
  const ownedMark = '# owned by another installer\n';
  writeFileSync(ownedSkill, ownedMark);
  const binding = path.join(FIXTURE_ROOT, 'umbrella', 'private-bindings.md');
  if (PUBLIC_SNAPSHOT) {
    if (existsSync(binding)) {
      console.error('fixture binding: public install copied private-bindings.md');
      process.exit(1);
    }
    console.log('fixture binding: omitted');
  } else if (!existsSync(binding)) {
    console.error('fixture binding: umbrella/private-bindings.md was not installed');
    process.exit(1);
  } else {
    console.log(`fixture binding: ${label(binding)}`);
  }
  if (readFileSync(ownedSkill, 'utf8') !== ownedMark) {
    console.error('fixture WIP: unmarked skill was replaced');
    process.exit(1);
  }
  console.log(`  fixture ${label(FIXTURE_ROOT)}`);
  console.log('fixture: unmarked non-pack skill left in place');
  console.log('fixture-root: skipped personal mirror, rules, hook config, project.yml, standing rules, skills-overlay, and swarm docs');
  process.exit(0);
} else for (const rel of USER_SKILL_DIRS) {
  const dest = path.join(homedir(), rel);
  if (!copyOverlayInto(dest, skillsOverlayRoot)) installRefused += 1;
  skillDests.push(dest);
  console.log(`  user  ${label(dest)}`);
}

if (!FIXTURE_ROOT) for (const { repo, dirs } of WORKSPACE_TARGETS) {
  const repoRoot = path.join(workspaceRoot, repo);
  if (!existsSync(repoRoot)) {
    console.log(`  skip  ${repo} (not next to this clone)`);
    continue;
  }
  for (const rel of dirs) {
    const dest = path.join(repoRoot, rel);
    if (!copyOverlayInto(dest, skillsOverlayRoot)) installRefused += 1;
    skillDests.push(dest);
    console.log(`  repo  ${repo}/${rel}`);
  }
}

if (!FIXTURE_ROOT) for (const { dir: dest, box } of EXTRA_DESTS) {
  // --box on a machine without the box layout: skip instead of inventing /home/box.
  if (box && !existsSync(path.dirname(dest))) {
    console.log(`  skip  ${label(dest)} (--box: parent folder missing; not the Grok Bot box?)`);
    continue;
  }
  if (!copyOverlayInto(dest, skillsOverlayRoot)) installRefused += 1;
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
  swarmSkillNames = new Set(names);
  const swarmDests = [...new Set(skillDests.map((d) => path.resolve(d)))];
  for (const dest of swarmDests) {
    if (!copySwarmInto(dest, swarmRoot, names, skillsOverlayRoot)) installRefused += 1;
    // Older directory names are not current swarm skills. Words inside a skill
    // file do not make the tree disposable. Leave the entry, including a symlink.
    for (const retired of LEGACY_MIRROR_NAMES) {
      const dir = path.join(dest, retired);
      let present = true;
      try {
        lstatSync(dir);
      } catch (error) {
        if (error && error.code === 'ENOENT') present = false;
        else throw error;
      }
      if (!present) continue;
      refusedDestinations.add(path.resolve(dir));
      console.error(`sync: refuse to replace ${label(dir)} (legacy). Not deleted.`);
      installRefused += 1;
    }
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
    if (existsSync(skillsOverlay) && applySkillsOverlay(dest, skillsOverlay)) {
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
// Machine-independent source for the marker, so syncs on different machines write the same file.
function sourceNote(p) {
  const rel = (base, prefix) => {
    const r = path.relative(base, p);
    return r && !r.startsWith('..') && !path.isAbsolute(r) ? `${prefix}${r}` : null;
  };
  return label(rel(workspaceRoot, '') || rel(homedir(), '~/') || p);
}
function mirrorSkill(from, to, note) {
  // A path refused earlier stays. An existing symlink is not a missing
  // directory, including when its target is missing. Skipping this write
  // does not make the rest of the run atomic.
  if (refusedDestinations.has(path.resolve(to))) return false;
  let info = null;
  try {
    info = lstatSync(to);
  } catch (error) {
    if (!error || error.code !== 'ENOENT') throw error;
  }
  if (info && !info.isDirectory()) return false;
  if (info && !isMirrorCopy(to)) return false; // another installer owns it
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
      if (seen.has(name) || packOwned.has(name) || mirrorExclude.has(name) || LEGACY_MIRROR_NAMES.has(name)) continue;
      const from = path.join(repoRoot, srcRel, name);
      if (isMirrorCopy(from) || refusedDestinations.has(path.resolve(from))) continue; // a copy, or a path already refused
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
      if (packOwned.has(name) || mirrorExclude.has(name) || LEGACY_MIRROR_NAMES.has(name) || isMirrorCopy(dir)) continue;
      if (refusedDestinations.has(path.resolve(dir))) continue;
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
      if (refusedDestinations.has(path.resolve(dir))) continue;
      let info = null;
      try {
        info = lstatSync(dir);
      } catch (error) {
        if (!error || error.code !== 'ENOENT') throw error;
      }
      if (info && info.isDirectory() && isMirrorCopy(dir)) { rmSync(dir, { recursive: true, force: true }); removed.push(`${rel}/${name}`); }
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
  const toolOwn = [];
  for (const root of roots) {
    for (const name of skillNames(root)) {
      if (packOwned.has(name) || mirrorExclude.has(name) || LEGACY_MIRROR_NAMES.has(name) || sources.has(name)) continue;
      const dir = path.join(root, name);
      if (isMirrorCopy(dir) || refusedDestinations.has(path.resolve(dir))) continue;
      if (toolOwnerOf(dir)) { toolOwn.push(label(dir)); continue; }
      sources.set(name, dir);
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
  if (toolOwn.length) console.log(`  tool  ${toolOwn.length} skill(s) a tool installed for itself, not mirrored: ${toolOwn.join(', ')}`);
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

if (installRefused) failures += installRefused;
if (failures) {
  console.error(`Done with ${failures} failure(s) above.`);
  process.exitCode = 1;
} else {
  console.log(`Done. Overlay${swarmRoot ? ' + swarm pack' : ''} copied; other skills were left in place.`);
}
if (!hasPrivate) {
  console.log('Tip: clone your private overlay next to this pack to layer project.yml + standing rules.');
}
