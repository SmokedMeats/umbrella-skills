/**
 * Copy this overlay into user-global skill dirs and every XyberRun
 * workspace repo that sits next to this clone.
 *
 *   node scripts/sync-workspace.mjs
 *
 * Only replaces the nine overlay skill folders. Other project skills stay.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
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
  'wayfinder',
];

const USER_SKILL_DIRS = ['.grok/skills', '.cursor/skills', '.claude/skills', '.agents/skills'];

const WORKSPACE_TARGETS = [
  // XyberRun .grok/skills is product-only (gh-mix, audit, …). Overlay
  // goes in the gitignored .cursor/skills copy plus user-global ~/.grok.
  { repo: 'XyberRun', dirs: ['.cursor/skills'] },
  { repo: 'XyberRun.IO', dirs: ['.cursor/skills'] },
  { repo: 'XyberRun-AppleWatch', dirs: ['.cursor/skills'] },
  { repo: 'XyberRun-AndroidWatch', dirs: ['.cursor/skills'] },
];

const here = path.dirname(fileURLToPath(import.meta.url));
const packRoot = path.resolve(here, '..');
const srcRoot = path.join(packRoot, 'skills');
const workspaceRoot = path.resolve(packRoot, '..');

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

function label(p) {
  return p.replaceAll('\\', '/');
}

if (!existsSync(srcRoot)) {
  throw new Error(`No skills/ next to this script: ${srcRoot}`);
}

const present = new Set(readdirSync(srcRoot));
const missing = OVERLAY_SKILLS.filter((name) => !present.has(name));
if (missing.length > 0) {
  throw new Error(`Pack is missing overlay folders: ${missing.join(', ')}`);
}

console.log(`Pack: ${label(packRoot)}`);

for (const rel of USER_SKILL_DIRS) {
  const dest = path.join(homedir(), rel);
  copyOverlayInto(dest);
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
    console.log(`  repo  ${repo}/${rel}`);
  }
}

console.log('Done. Overlay copied; other skills were left in place.');
