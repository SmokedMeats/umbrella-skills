#!/usr/bin/env node
// Shared full-flow contract for this pack. One CONVENTIONS section, invoked from
// implement, with the conditional trigger table. sync-workspace runs this with
// check-steps. A missing phrase or a forbidden pin is a problem string.
//
//   node scripts/check-shared-flow.mjs [packRoot]
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SNIPPETS = {
  conventions: [
    'No new skill folder.',
    'use it to pick and route work.',
    'enter `/implement` when product discovery',
    'does not waive those guards',
    'not required for a standalone',
    'Do not batch-tick at the end.',
    'Do not tick a conditional gate that did not fire.',
    'never unilaterally marked N/A',
    'not a blanket full BV',
    'Squash SHA need not equal review SHA',
    'does not hardcode a product Effect major',
    'Do not invent access.',
    'Do not ask the user to perform the board or branch action.',
    'Do not delete a WIP branch.',
    'does not waive the receipt',
    'The writer does not mark that row N/A.',
    '#### Conditional skill trigger table',
    'A locked small bug stays on its existing path.',
    'Standalone does not require swarm.',
    'PASS / PARTIAL / FAIL table.',
    '2+ actor races, or a product Statechart standing rule',
    'Installed version read from the lockfile.',
    'This pack does not add skip reasons.',
    'Not a new grill.',
    'Gate by patch, not commit',
    'Merge-queue carry-over',
    'Recheck at merge',
    'closest sibling module',
    'canonical patterns doc',
    'CAPABILITY_HANDOFF',
    'Chief of Staff',
    '/diagnosing-bugs',
    '/device-qa-agent',
    '/tech-lead-review',
    'blast-radius and cycles when configured',
  ],
  implementSection: [
    'still run **Acceptance criteria gate**, **House** claim, and **Coding-spawn gate**',
    'A missing `/start-work` does not waive those guards.',
    'PASS / PARTIAL / FAIL on that ticket',
    '**Effect Schema inventory** when configured',
    '`/deslop` on this ticket\'s diff',
    'blast-radius and cycles when that skill\'s rules say to run them',
    '**Repeat failure** when the same check fails twice',
    'independent `/build-verifier`',
    '**Close gate**',
    'BLOCKED or a capability handoff, not writer N/A',
    'does not waive the receipt',
    '**Your Pipeline ticks**',
    'seam test when behavior changes',
  ],
  backend: [
    'on the **installed** `effect` package',
    'read that version from the product `package.json` and lockfile',
    'does not pin a major or minor',
    'canonical Effect patterns doc',
    'one actual closest sibling module',
  ],
  toSpec3a: [
    'product\'s standing rules require a statechart',
    'money, entitlements or locking, or where 2+ actors race (webhooks, retries, timers)',
    'required once the trigger fires',
    'BLOCKED or a capability handoff, not writer `n/a`',
    'write `n/a` with the reason the trigger did not fire',
  ],
  statechartScope: [
    'The trigger is scoped and conditional',
    'Once any of those triggers fires, Statechart is required.',
    'This pack does not cite product-only issue numbers',
    'does not require a statechart for every spec',
    'money, entitlements, locking, and multi-actor race conditions in step 3a',
    'They do not replace those conditions.',
  ],
  buildVerifier: [
    'Run checks 1 to 8',
    '8. **Database test lanes**',
    '## Database test lanes',
    '## Statechart rerun',
    'openTestPostgres()',
    'A skipped database test is not a real-database or R2 pass',
    'Before a product card moves to Ready to merge',
  ],
  lane: [
    "proof: the table in the reply, with each ticket's live Project Status.",
    '| Unblocked | Role | Ticket | Status |',
    '| *N* | conductor / child / this session | #n · title | live Project Status |',
    'A `blocked_by` on **Live Beta**, **GoLive**, or **Ready to merge** still holds. **Ready to merge** holds until the founder merges.',
    'held by a **Live Beta**, **GoLive**, or **Ready to merge** blocker in this house',
    'Unlock dependents now. A `blocked_by` on **Live Beta**, **GoLive**, or **Ready to merge** still holds.',
    'leftover-lane cards do not count; a `blocked_by` on **Live Beta**, **GoLive**, or **Ready to merge** still holds',
    'Close -> **Done** only when applicable checks and QA are done',
    'Dependents **WAIT** while it is Ready to merge. After the founder merges, set the lane from what is left.',
    '**Done** only when applicable checks and QA are done.',
    '| Pull request open, checks green, waiting on merge | Ready to merge |',
    '| Outdoor, GPS, or on-wrist proof still required | Field |',
    '| Merged or pushed, applicable checks and QA done, nothing else left | Done |',
    'Do not put them on **Desk device** or **Field**.',
    'A golden or other desk-phone check stays **Desk device**.',
    '**Field** only for outdoor, GPS, or on-wrist proof.',
    '**Field** is outdoor, GPS, or on-wrist proof only.',
  ],
  preserved: [
    'Pilot area only',
    'None of the five is a coding spawn',
    '**Coding-spawn gate:**',
    'area-coordinator `## Tick owners` and `## Native GitHub structure`',
  ],
};

const NEW_TEXT_BANNED = [
  'when installed',
  '3.22.1',
  'No Effect v4',
  'Effect v4',
  '4.0.6',
  '24178',
  'bc8a4b34',
  'opt-in',
];

const SCOPE_BANNED = ['opt-in'];

export function sliceHeading(text, heading) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.indexOf(heading);
  if (start < 0) return '';
  const level = heading.match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const mark = lines[i].match(/^(#+)\s/);
    if (mark && mark[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

export function sliceBetween(text, startMark, endMark) {
  const start = text.indexOf(startMark);
  if (start < 0) return '';
  const end = text.indexOf(endMark, start + startMark.length);
  return end < 0 ? text.slice(start) : text.slice(start, end);
}

function missing(problems, where, body, snippets) {
  if (!body) {
    problems.push(`${where}: section missing`);
    return;
  }
  for (const snippet of snippets) {
    if (!body.includes(snippet)) problems.push(`${where}: missing ${snippet}`);
  }
}

function banned(problems, where, body, tokens) {
  for (const token of tokens) {
    if (body.includes(token)) problems.push(`${where}: forbidden ${token}`);
  }
}

export const INSTALLED_BINDING = 'skills/umbrella/private-bindings.md';
export const INSTALL_SKILL_ROOTS = ['.grok/skills', '.cursor/skills', '.claude/skills', '.agents/skills', '.copilot/skills'];
export const BOX_SKILLS_ROOT = '/home/box/agent-data/workflows';
const DANGLING_BINDING = ['private/bindings.md', 'private-bindings.md'];

export function copyOverlaySkillDir(fromDir, destRoot) {
  const to = path.join(destRoot, path.basename(fromDir));
  rmSync(to, { recursive: true, force: true });
  cpSync(fromDir, to, { recursive: true });
  return to;
}

export function scrubTokens(bindings) {
  const start = bindings.indexOf('## Scrub');
  if (start < 0) return [];
  const tokens = [];
  for (const line of bindings.slice(start).split('\n').slice(1)) {
    if (line.startsWith('## ')) break;
    const token = line.trim();
    if (token) tokens.push(token);
  }
  return tokens;
}

/** @param {ReturnType<typeof loadPack>} docs */
export function sharedFlowProblems(docs) {
  const problems = [];
  const conventions = sliceHeading(docs.conventions, '### Shared full-flow entry');
  const implementSection = sliceHeading(docs.implement, '## Shared full-flow entry (no new skill)');
  const backend = sliceBetween(docs.implement, '**Backend domain functions**', '**Cycles**');
  const step3a = docs.toSpec.split('\n').find((line) => line.startsWith('3a. ')) || '';
  const scope = sliceHeading(docs.toSpec, '## Statechart scope');

  const conventionHits = docs.conventions.split('\n').filter((line) => line === '### Shared full-flow entry');
  if (conventionHits.length !== 1) {
    problems.push(`conventions: expected one Shared full-flow entry, found ${conventionHits.length}`);
  }

  missing(problems, 'conventions', conventions, SNIPPETS.conventions);
  missing(problems, 'implement', implementSection, SNIPPETS.implementSection);
  missing(problems, 'backend', backend, SNIPPETS.backend);
  missing(problems, 'to-spec 3a', step3a, SNIPPETS.toSpec3a);
  missing(problems, 'statechart scope', scope, SNIPPETS.statechartScope);
  missing(problems, 'build-verifier', docs.buildVerifier, SNIPPETS.buildVerifier);
  if (docs.buildVerifier.includes('checks 1 to 7')) {
    problems.push('build-verifier: forbidden checks 1 to 7');
  }
  const laneText = [docs.implement || '', docs.deviceQa || '', docs.deviceQaDoc || ''].join('\n');
  missing(problems, 'lanes', laneText, SNIPPETS.lane);
  const bindings = docs.privateBindings || '';
  const published = [docs.toSpec, docs.buildVerifier, docs.implement, docs.conventions, docs.umbrella].join('\n');
  const dangling = DANGLING_BINDING.filter((token) => published.includes(token));
  const publicArchive = docs.packMode === 'public';
  if (publicArchive && bindings) {
    problems.push('public archive must omit private bindings');
  }
  if (!publicArchive && !bindings) {
    problems.push('required binding missing; fail closed');
  }
  if (dangling.length > 0) {
    problems.push(`published skill requires a binding path: ${dangling.join(', ')}`);
  }
  if (bindings) {
    if (!/^Pilot: #\d+ `.+` \(PR #\d+\)\.$/m.test(bindings)) {
      problems.push('private bindings: pilot line missing');
    }
    if (!bindings.includes('card moves to Ready to merge')) {
      problems.push('private bindings: product card line missing');
    }
    if (!INSTALLED_BINDING.startsWith('skills/umbrella/')) {
      problems.push('private binding is not inside the umbrella skill folder');
    }
    for (const token of scrubTokens(bindings)) {
      if (published.includes(token)) problems.push(`published skill contains private token ${token}`);
    }
  }

  banned(problems, 'conventions', conventions, NEW_TEXT_BANNED);
  banned(problems, 'implement', implementSection, NEW_TEXT_BANNED);
  banned(problems, 'backend', backend, ['3.22.1', 'No Effect v4', 'Effect v4', '4.0.6', '24178', 'bc8a4b34']);
  banned(problems, 'to-spec 3a', step3a, ['opt-in', 'when installed', '3.22.1', '4.0.6']);
  banned(problems, 'statechart scope', scope, SCOPE_BANNED);

  for (const snippet of SNIPPETS.preserved.slice(0, 3)) {
    if (!docs.implement.includes(snippet)) problems.push(`implement preserved: missing ${snippet}`);
  }
  if (!docs.toTickets.includes(SNIPPETS.preserved[3])) {
    problems.push(`to-tickets preserved: missing ${SNIPPETS.preserved[3]}`);
  }
  if (!docs.umbrella.includes('**Shared full-flow entry**')) {
    problems.push('umbrella index: missing **Shared full-flow entry**');
  }
  if (docs.umbrella.includes('CAPABILITY_HANDOFF')) {
    problems.push('umbrella index: CAPABILITY_HANDOFF belongs only in CONVENTIONS');
  }
  if (!docs.sync.includes('./check-shared-flow.mjs')) {
    problems.push('sync: missing ./check-shared-flow.mjs');
  }
  if (docs.hasStartWork) problems.push('pack: skills/start-work must not ship here');
  if (docs.hasAreaCoordinator) problems.push('pack: skills/area-coordinator must not ship here');
  if (docs.hasSharedSkill) problems.push('pack: skills/shared-full-flow must not ship here');
  return problems;
}

export function loadPack(packRoot) {
  const read = (rel) => readFileSync(path.join(packRoot, rel), 'utf8');
  return {
    conventions: read('skills/umbrella/CONVENTIONS.md'),
    implement: read('skills/implement/SKILL.md'),
    toSpec: read('skills/to-spec/SKILL.md'),
    umbrella: read('skills/umbrella/SKILL.md'),
    toTickets: read('skills/to-tickets/SKILL.md'),
    sync: read('scripts/sync-workspace.mjs'),
    buildVerifier: read('skills/build-verifier/SKILL.md'),
    deviceQa: read('skills/device-qa-agent/SKILL.md'),
    deviceQaDoc: read('skills/umbrella/DEVICE-QA.md'),
    privateBindings: existsSync(path.join(packRoot, INSTALLED_BINDING))
      ? read(INSTALLED_BINDING)
      : '',
    hasStartWork: existsSync(path.join(packRoot, 'skills/start-work')),
    hasAreaCoordinator: existsSync(path.join(packRoot, 'skills/area-coordinator')),
    hasSharedSkill: existsSync(path.join(packRoot, 'skills/shared-full-flow')),
  };
}

export function checkSharedFlow(packRoot) {
  const problems = sharedFlowProblems(loadPack(packRoot));
  return problems.length === 0 ? [] : [{ skill: 'shared-flow', problems }];
}

export function reportSharedFlow(failures) {
  if (failures.length === 0) return true;
  console.error('check-shared-flow: shared full-flow entry is incomplete:');
  for (const { skill, problems } of failures) {
    for (const problem of problems) console.error(`  ${skill}: ${problem}`);
  }
  return false;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter((arg) => arg !== '--public');
  const packMode = process.argv.includes('--public') ? 'public' : 'source';
  const root = path.resolve(args[0] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const pack = loadPack(root);
  pack.packMode = packMode;
  const problems = sharedFlowProblems(pack);
  if (!reportSharedFlow(problems.length === 0 ? [] : [{ skill: 'shared-flow', problems }])) process.exit(1);
  console.log(`check-shared-flow: OK (${packMode})`);
}
