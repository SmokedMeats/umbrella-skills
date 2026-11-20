#!/usr/bin/env node
// Skill frontmatter lint for this pack.
//
// Ported from addyosmani/agent-skills scripts/lib/skill-lint.js (MIT):
// https://github.com/addyosmani/agent-skills/blob/main/scripts/lib/skill-lint.js
// Copyright (c) 2025 Addy Osmani. Kept as the frontmatter name, description length,
// when-to-use trigger, and 500-line warning. This pack does not use that
// repo's required sections, persona files, or unknown-key rules, so those
// checks are not copied. Relative-link resolution is the check this pack
// asked for on top of that port.
//
// check-pr-ready, check-public-safe, check-readiness, check-shared-flow,
// check-steps, and check-updates do not validate frontmatter, description
// triggers, relative links, or the 500-line budget. check-updates only reads
// frontmatter to diff upstream skill text. This file is the one place those
// checks live.
//
//   node scripts/skill-lint.mjs [packRoot]
//
// Skill files and relative-link targets are read from the committed HEAD tree
// (`git ls-tree` / `git show`), not the working tree. A gitignored or untracked
// file cannot satisfy a link.
//
// Errors exit 1. A SKILL.md over 500 lines is a warning and exits 0.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_DESCRIPTION_LENGTH = 1024;
export const MAX_SKILL_LINES = 500;

// A description must say when to use the skill. "Use when", "Use this when",
// and "Use before|after|during" count. "Do not use when" does not.
const DESCRIPTION_TRIGGER = /\buse (this )?when\b|\buse (before|after|during)\b/i;
const DESCRIPTION_TRIGGER_NEGATE = /\b(do not|don't|never) use (this )?(when|before|after|during)\b/i;
const DESCRIPTION_TRIGGER_NEGATE_ALL = new RegExp(DESCRIPTION_TRIGGER_NEGATE.source, 'gi');

// Resolves after sync installs Matt's unedited skill beside the overlay.
// MAINTAINING forbids copying that body into skills/.
export const RELATIVE_LINK_ALLOWLIST = [
  { file: 'skills/implement/SKILL.md', target: '../codebase-design/SKILL.md' },
];

function unquoteScalar(raw) {
  if (/^[>|][-+]?\s*$/.test(raw)) return '';
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1).replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1).replace(/''/g, "'");
  }
  return raw;
}

/** Frontmatter object, or null when the file has no opening --- block. Folded `>` / `|` values are joined so the length and trigger checks see the description text. */
export function parseFrontmatter(content) {
  const match = content.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) return null;
  const result = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const found = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (found) {
      key = found[1];
      result[key] = unquoteScalar(found[2].trim());
      continue;
    }
    if (key && /^\s+\S/.test(line)) {
      result[key] = `${result[key]} ${line.trim()}`.replace(/\s+/g, ' ').trim();
    }
  }
  return result;
}

/** Fence bodies become blank lines so example links and headings are not linted. Line count stays on the original text. */
export function stripFencedCodeBlocks(content) {
  const out = [];
  let open = null;
  for (const line of content.split(/\r?\n/)) {
    if (open) {
      const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (close && close[1][0] === open.marker && close[1].length >= open.length) open = null;
      out.push('');
      continue;
    }
    const start = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (start && !(start[1][0] === '`' && start[2].includes('`'))) {
      open = { marker: start[1][0], length: start[1].length };
      out.push('');
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

function triggerProblem(description) {
  const hasTrigger = DESCRIPTION_TRIGGER.test(description);
  const stripped = description.replace(DESCRIPTION_TRIGGER_NEGATE_ALL, '');
  const onlyNegated = hasTrigger && DESCRIPTION_TRIGGER_NEGATE.test(description) && !DESCRIPTION_TRIGGER.test(stripped);
  if (!hasTrigger || onlyNegated) {
    return 'Description has no \'when to use\' trigger — add a "Use when …" clause';
  }
  return '';
}

/** Errors and warnings for one SKILL.md. `dirName` is the skill folder name. */
export function lintSkillText(dirName, content) {
  const errors = [];
  const warnings = [];
  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push('Missing or malformed YAML frontmatter (expected --- block at top of file)');
    return { errors, warnings };
  }
  if (!fm.name) errors.push("Frontmatter missing required field: 'name'");
  else if (fm.name !== dirName) errors.push(`Frontmatter name '${fm.name}' does not match directory name '${dirName}'`);
  if (!fm.description) {
    errors.push("Frontmatter missing required field: 'description'");
  } else {
    if (fm.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(`Description is ${fm.description.length} chars — exceeds the ${MAX_DESCRIPTION_LENGTH}-char limit`);
    }
    const trigger = triggerProblem(fm.description);
    if (trigger) errors.push(trigger);
  }
  const lineCount = (content.match(/\n/g) || []).length;
  if (lineCount > MAX_SKILL_LINES) {
    warnings.push(`SKILL.md is ${lineCount} lines, over the ${MAX_SKILL_LINES}-line budget — move detail into a supporting file`);
  }
  return { errors, warnings };
}

function isRelativeLink(url) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return false;
  if (url.startsWith('#')) return false;
  if (url.startsWith('/')) return false;
  const pathPart = url.split('#')[0];
  if (!pathPart) return false;
  return pathPart.startsWith('.') || pathPart.includes('/') || /\.[a-z0-9]+$/i.test(pathPart);
}

/**
 * Errors for relative markdown links in `content`.
 * `fromFile` and `packRoot` are absolute. `fileExists` receives a pack-relative
 * posix path and reports whether that committed path is present. Bare words
 * (`url`, `link`) are template slots, not paths. Links inside fences are ignored.
 */
export function lintRelativeLinks(content, fromFile, packRoot, allow = RELATIVE_LINK_ALLOWLIST, fileExists = null) {
  const errors = [];
  const prose = stripFencedCodeBlocks(content);
  const relFile = path.relative(packRoot, fromFile).split(path.sep).join('/');
  const exists = fileExists || ((rel) => existsSync(rel ? path.join(packRoot, rel) : packRoot));
  const linkRe = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
  let match = linkRe.exec(prose);
  while (match) {
    let url = match[1].trim();
    if (url.startsWith('<') && url.endsWith('>')) url = url.slice(1, -1);
    if (isRelativeLink(url)) {
      let pathPart = '';
      try {
        pathPart = decodeURIComponent(url.split('#')[0]);
      } catch {
        errors.push(`Relative link does not resolve: ${url}`);
        match = linkRe.exec(prose);
        continue;
      }
      const allowed = allow.some((row) => row.file === relFile && row.target === pathPart);
      const abs = path.resolve(path.dirname(fromFile), pathPart);
      const relTarget = path.relative(packRoot, abs).split(path.sep).join('/');
      const outside = relTarget.startsWith('..') || path.isAbsolute(relTarget);
      if (!allowed && (outside || !exists(relTarget))) errors.push(`Relative link does not resolve: ${url}`);
    }
    match = linkRe.exec(prose);
  }
  return errors;
}

function git(packRoot, args) {
  return spawnSync('git', args, { cwd: packRoot, encoding: 'utf8', maxBuffer: 1 << 28 });
}

/** Posix paths committed at HEAD, or null when that tree cannot be read. */
export function committedPaths(packRoot) {
  const listed = git(packRoot, ['ls-tree', '-r', '-z', '--full-tree', 'HEAD']);
  if (listed.status !== 0) return null;
  const paths = new Set();
  for (const entry of listed.stdout.split('\0')) {
    if (!entry) continue;
    const tab = entry.indexOf('\t');
    if (tab < 0) continue;
    paths.add(entry.slice(tab + 1).replace(/\\/g, '/'));
  }
  return paths;
}

function pathInTree(paths, rel) {
  if (!rel) return paths.size > 0;
  if (paths.has(rel)) return true;
  const prefix = `${rel}/`;
  for (const item of paths) {
    if (item.startsWith(prefix)) return true;
  }
  return false;
}

function showCommitted(packRoot, rel) {
  const run = git(packRoot, ['show', `HEAD:${rel}`]);
  if (run.status !== 0) return null;
  return run.stdout;
}

/** `{ errors, warnings }` for committed `skills/` at HEAD. Each string is `skills/<path>: <problem>`. */
export function lintPack(packRoot, { allow = RELATIVE_LINK_ALLOWLIST } = {}) {
  const errors = [];
  const warnings = [];
  const paths = committedPaths(packRoot);
  if (!paths) {
    errors.push('skills/: cannot read the HEAD tree');
    return { errors, warnings };
  }
  const skillNames = new Set();
  let sawSkills = false;
  for (const rel of paths) {
    if (!rel.startsWith('skills/')) continue;
    sawSkills = true;
    const name = rel.slice('skills/'.length).split('/')[0];
    if (name) skillNames.add(name);
  }
  if (!sawSkills) {
    errors.push('skills/: skills directory is missing');
    return { errors, warnings };
  }
  const exists = (rel) => pathInTree(paths, rel);
  for (const dirName of [...skillNames].sort()) {
    const relSkill = `skills/${dirName}/SKILL.md`;
    if (!paths.has(relSkill)) {
      errors.push(`${relSkill}: Missing SKILL.md`);
      continue;
    }
    const content = showCommitted(packRoot, relSkill);
    if (content == null) {
      errors.push(`${relSkill}: cannot read HEAD:${relSkill}`);
      continue;
    }
    const result = lintSkillText(dirName, content);
    for (const error of result.errors) errors.push(`${relSkill}: ${error}`);
    for (const warning of result.warnings) warnings.push(`${relSkill}: ${warning}`);
    const markdown = [...paths].filter((rel) => rel.startsWith(`skills/${dirName}/`) && rel.endsWith('.md')).sort();
    for (const rel of markdown) {
      const text = rel === relSkill ? content : showCommitted(packRoot, rel);
      if (text == null) {
        errors.push(`${rel}: cannot read HEAD:${rel}`);
        continue;
      }
      const fromFile = path.join(packRoot, ...rel.split('/'));
      for (const error of lintRelativeLinks(text, fromFile, packRoot, allow, exists)) {
        errors.push(`${rel}: ${error}`);
      }
    }
  }
  return { errors, warnings };
}

function report(packRoot) {
  const { errors, warnings } = lintPack(packRoot);
  for (const warning of warnings) console.log(`skill-lint: WARN ${warning}`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`skill-lint: ${error}`);
    console.log(`skill-lint: FAIL ${errors.join(' | ')}`);
    return 1;
  }
  console.log('skill-lint: OK');
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const packRoot = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  process.exit(report(packRoot));
}
