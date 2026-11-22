// The outside packs this overlay builds on, and how each one's skills are laid out
// as <out>/skills/<name> (the same shape as vendor/<pack>/ in the private clone).
//
// install.mjs fetches each one at its newest release (Matt: newest semver tag; the
// others: default-branch HEAD) and lays it out with layoutUpstream. check-updates.mjs
// uses layoutUpstream for the same "latest" trees it diffs against vendor/.
// vendor/pins.json (private clone only) records which commit vendor/ holds.

import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const UPSTREAMS = [
  { name: 'mattpocock-skills', repo: 'https://github.com/mattpocock/skills', ref: 'latest-tag' },
  { name: 'simple-english', repo: 'https://github.com/AminBlg/SimpleEnglish', ref: 'head' },
  // Only the pstack skills the overlay calls by name: /to-spec runs /statechart, /implement runs /no-comments.
  {
    name: 'pstack-skills', repo: 'https://github.com/cursor/plugins', ref: 'head', path: 'pstack',
    skills: ['statechart', 'no-comments'], omit: ['statechart/scripts/test'],
  },
  // /implement Comment cleanup runs /deslop (Cursor's cursor-team-kit plugin, MIT).
  {
    name: 'cursor-team-kit-skills', repo: 'https://github.com/cursor/plugins', ref: 'head', path: 'cursor-team-kit',
    skills: ['deslop'], omit: [],
  },
];

// Upstream skills the overlay routes to by name. install.mjs refuses to install when the
// newest releases drop one of them.
export const ROUTED_UPSTREAM_SKILLS = [
  'setup-matt-pocock-skills', 'tdd', 'domain-modeling', 'diagnosing-bugs', 'prototype', 'codebase-design',
  'research', 'retro', 'pr', 'handoff', 'wait-what', 'writing-for-agents', 'simple-english',
  'statechart', 'no-comments', 'deslop',
];

// Newest plain semver tag (v1.2.3 or 1.2.3) from a list of tag names, or null.
export function newestSemverTag(tags) {
  const parse = (t) => t.replace(/^v/, '').split('.').map(Number);
  const sorted = tags.filter((t) => t && /^v?\d+\.\d+\.\d+$/.test(t)).sort((a, b) => {
    const pa = parse(a);
    const pb = parse(b);
    return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
  });
  return sorted.at(-1) || null;
}

function copy(from, to, skip = () => false) {
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true, filter: (src) => path.basename(src) !== '.git' && !skip(src) });
}

// src: a checkout of the upstream repo. out: the pack folder to write.
export function layoutUpstream(upstream, src, out) {
  if (upstream.name === 'mattpocock-skills') {
    const manifest = JSON.parse(readFileSync(path.join(src, '.claude-plugin', 'plugin.json'), 'utf8'));
    for (const rel of manifest.skills) copy(path.join(src, rel), path.join(out, 'skills', path.basename(rel)));
    copy(path.join(src, '.claude-plugin', 'plugin.json'), path.join(out, 'plugin.json'));
    copy(path.join(src, 'LICENSE'), path.join(out, 'LICENSE'));
    return manifest;
  }
  if (upstream.name === 'simple-english') {
    copy(path.join(src, 'skills', 'simple-english'), path.join(out, 'skills', 'simple-english'));
    copy(path.join(src, 'LICENSE'), path.join(out, 'LICENSE'));
    return null;
  }
  // A few named skills out of one cursor/plugins plugin folder.
  if (upstream.path && upstream.skills) {
    const root = path.join(src, upstream.path);
    const omit = (upstream.omit || []).map((rel) => path.join(root, 'skills', rel));
    for (const name of upstream.skills) {
      const from = path.join(root, 'skills', name);
      if (!existsSync(path.join(from, 'SKILL.md'))) throw new Error(`${upstream.repo} ${upstream.path} no longer ships ${name}`);
      copy(from, path.join(out, 'skills', name), (p) => omit.some((o) => p === o || p.startsWith(o + path.sep)));
    }
    copy(path.join(root, 'LICENSE'), path.join(out, 'LICENSE'));
    return null;
  }
  throw new Error(`unknown upstream ${upstream.name}`);
}
