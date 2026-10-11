#!/usr/bin/env node
// Every phase skill opens with a short `## Steps` playbook (umbrella CONVENTIONS.md
// **Steps**): at most MAX_STEPS numbered lines per list, each ending in a `proof:`.
// Agents copy that list into their todo and child packets, so a missing or bloated list
// breaks the conductor. sync-workspace.mjs runs this before it copies anything.
//
//   node scripts/check-steps.mjs [packRoot]
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PHASE_SKILLS = [
  'umbrella',
  'triage',
  'wayfinder',
  'grill-me',
  'to-spec',
  'to-tickets',
  'implement',
  'code-review',
  'build-verifier',
  'device-qa-agent',
  'device-qa-verifier',
];
export const MAX_STEPS = 8;

/** Problems with one skill's `## Steps` section; empty when it is well formed. */
export function stepsProblems(text) {
  const body = text.replace(/\r\n?/g, '\n');
  const start = body.search(/^## Steps\n/m);
  if (start < 0) return ['no `## Steps` section'];
  const rest = body.slice(start + '## Steps\n'.length);
  const end = rest.search(/^## /m);
  const section = end < 0 ? rest : rest.slice(0, end);
  if (!/CONVENTIONS\.md[^\n]*\*\*Steps\*\*/.test(section)) {
    return ['the Steps intro does not point at CONVENTIONS.md **Steps**'];
  }
  const problems = [];
  // A list restarts at 1 (wayfinder has one list per mode).
  const lists = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^(\d+)\. (.*)$/);
    if (!m) continue;
    const n = Number(m[1]);
    if (n === 1) lists.push([]);
    const list = lists[lists.length - 1];
    if (!list || n !== list.length + 1) problems.push(`step ${n} is out of order`);
    list?.push(m[2]);
    if (!/ proof: \S/.test(m[2])) problems.push(`step ${n} has no "proof:"`);
  }
  if (lists.length === 0) problems.push('no numbered steps');
  for (const list of lists) {
    if (list.length > MAX_STEPS) problems.push(`a list has ${list.length} steps (max ${MAX_STEPS})`);
  }
  return problems;
}

/** `[{ skill, problems }]` for every phase skill under `<packRoot>/skills` with a problem. */
export function checkSteps(packRoot) {
  const failures = [];
  for (const skill of PHASE_SKILLS) {
    const file = path.join(packRoot, 'skills', skill, 'SKILL.md');
    const problems = existsSync(file) ? stepsProblems(readFileSync(file, 'utf8')) : ['SKILL.md is missing'];
    if (problems.length > 0) failures.push({ skill, problems });
  }
  return failures;
}

export function reportSteps(failures) {
  if (failures.length === 0) return true;
  console.error('check-steps: phase skills need a short `## Steps` list (umbrella CONVENTIONS.md **Steps**):');
  for (const { skill, problems } of failures) console.error(`  ${skill}: ${problems.join('; ')}`);
  return false;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  if (!reportSteps(checkSteps(root))) process.exit(1);
  console.log(`check-steps: OK (${PHASE_SKILLS.length} phase skills)`);
}
