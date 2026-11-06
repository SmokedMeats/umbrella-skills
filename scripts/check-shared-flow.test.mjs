import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOX_SKILLS_ROOT,
  INSTALL_SKILL_ROOTS,
  INSTALLED_BINDING,
  SNIPPETS,
  copyOverlaySkillDir,
  loadPack,
  sharedFlowProblems,
} from './check-shared-flow.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '2b7272b55f3dc568d3ad064c995b31a4cb962a69';

function syntheticPack() {
  const conventions = ['### Shared full-flow entry', ...SNIPPETS.conventions, '### Steps'].join('\n');
  const implement = [
    '## Shared full-flow entry (no new skill)',
    ...SNIPPETS.implementSection,
    '## Acceptance criteria gate',
    `**Backend domain functions** ${SNIPPETS.backend.join(' ')}`,
    '**Cycles**',
    ...SNIPPETS.preserved.slice(0, 3),
    ...SNIPPETS.lane,
  ].join('\n');
  const toSpec = [
    `3a. **Statechart (scoped trigger).** ${SNIPPETS.toSpec3a.join(' ')}`,
    '## Statechart scope',
    ...SNIPPETS.statechartScope,
    '## Problem Statement',
  ].join('\n');
  return {
    conventions,
    implement,
    toSpec,
    umbrella: 'Sections: **Shared full-flow entry**, **Steps**.',
    toTickets: SNIPPETS.preserved[3],
    sync: "await import('./check-shared-flow.mjs');",
    buildVerifier: SNIPPETS.buildVerifier.join('\n'),
    deviceQa: '',
    deviceQaDoc: '',
    privateBindings: [
      'Pilot: #999 `docs/specs/models/example/` (PR #1000).',
      'Before a sample card moves to Ready to merge',
      '## Scrub',
      '#999',
      '#1000',
      'sample-card',
    ].join('\n'),
    hasStartWork: false,
    hasAreaCoordinator: false,
    hasSharedSkill: false,
  };
}

function packAt(rev) {
  const show = (file) => execSync(`git show ${rev}:${file}`, { cwd: root, encoding: 'utf8' });
  return {
    conventions: show('skills/umbrella/CONVENTIONS.md'),
    implement: show('skills/implement/SKILL.md'),
    toSpec: show('skills/to-spec/SKILL.md'),
    umbrella: show('skills/umbrella/SKILL.md'),
    toTickets: show('skills/to-tickets/SKILL.md'),
    sync: show('scripts/sync-workspace.mjs'),
    buildVerifier: show('skills/build-verifier/SKILL.md'),
    hasStartWork: false,
    hasAreaCoordinator: false,
    hasSharedSkill: false,
  };
}

test('a complete synthetic pack has no problems', () => {
  assert.deepEqual(sharedFlowProblems(syntheticPack()), []);
});

test('each required snippet is enforced', () => {
  const groups = [
    ['conventions', (docs, snippet) => {
      docs.conventions = docs.conventions.replace(snippet, '');
    }],
    ['implementSection', (docs, snippet) => {
      docs.implement = docs.implement.replace(snippet, '');
    }],
    ['backend', (docs, snippet) => {
      docs.implement = docs.implement.replace(snippet, '');
    }],
    ['toSpec3a', (docs, snippet) => {
      docs.toSpec = docs.toSpec.replace(snippet, '');
    }],
    ['statechartScope', (docs, snippet) => {
      docs.toSpec = docs.toSpec.replace(snippet, '');
    }],
    ['buildVerifier', (docs, snippet) => {
      docs.buildVerifier = docs.buildVerifier.replace(snippet, '');
    }],
    ['lane', (docs, snippet) => {
      docs.implement = docs.implement.replace(snippet, '');
    }],
  ];
  for (const [name, edit] of groups) {
    for (const snippet of SNIPPETS[name]) {
      const docs = syntheticPack();
      edit(docs, snippet);
      const problems = sharedFlowProblems(docs);
      assert.ok(
        problems.some((problem) => problem.includes(snippet)),
        `${name} dropped ${snippet} but problems were ${problems.join(' | ')}`,
      );
    }
  }
});

test('forbidden pins and writer-N/A wording fail', () => {
  const cases = [
    (docs) => {
      docs.conventions = docs.conventions.replace('### Steps', 'when installed\n### Steps');
    },
    (docs) => {
      docs.implement = docs.implement.replace('**Cycles**', 'Effect 3.22.1 No Effect v4\n**Cycles**');
    },
    (docs) => {
      docs.toSpec = docs.toSpec.replace('scoped trigger', 'opt-in');
    },
    (docs) => {
      docs.buildVerifier = docs.buildVerifier.replace('Run checks 1 to 8', 'Run checks 1 to 7');
    },
    (docs) => {
      docs.hasStartWork = true;
    },
    (docs) => {
      docs.hasSharedSkill = true;
    },
    (docs) => {
      docs.umbrella += '\nCAPABILITY_HANDOFF';
    },
    (docs) => {
      docs.toSpec += '\n#999';
    },
  ];
  for (const edit of cases) {
    const docs = syntheticPack();
    edit(docs);
    assert.ok(sharedFlowProblems(docs).length > 0);
  }
});

test('PR 56 head fails the shared-flow contract', () => {
  const problems = sharedFlowProblems(packAt(BASE));
  assert.ok(problems.some((problem) => problem.includes('section missing')));
  assert.ok(problems.some((problem) => problem.includes('Database test lanes')));
  assert.ok(problems.some((problem) => problem.includes('3.22.1') || problem.includes('opt-in')));
});

test('live pack satisfies shared full-flow', () => {
  const pack = loadPack(root);
  assert.ok(pack.privateBindings.length > 0);
  assert.deepEqual(sharedFlowProblems(pack), []);
});

test('a required binding path with no file fails closed', () => {
  const docs = syntheticPack();
  docs.privateBindings = '';
  docs.toSpec += '\nRead private/bindings.md before publish.';
  const problems = sharedFlowProblems(docs);
  assert.ok(problems.some((problem) => problem.includes('fail closed')));
});

test('missing bindings fail closed even when no skill names the path', () => {
  const docs = syntheticPack();
  docs.privateBindings = '';
  const problems = sharedFlowProblems(docs);
  assert.ok(problems.some((problem) => problem.includes('fail closed')));
  assert.equal(problems.some((problem) => problem.includes('requires a binding path')), false);
});

test('a public archive without the binding file is not a source-pack failure', () => {
  const docs = syntheticPack();
  docs.packMode = 'public';
  docs.privateBindings = '';
  const problems = sharedFlowProblems(docs);
  assert.equal(problems.some((problem) => problem.includes('fail closed')), false);
  assert.equal(problems.some((problem) => problem.includes('must omit private bindings')), false);
});

test('umbrella skill copy lands the private binding on an install root', () => {
  const dest = mkdtempSync(path.join(tmpdir(), 'umbrella-bind-'));
  try {
    const installed = copyOverlaySkillDir(path.join(root, 'skills', 'umbrella'), dest);
    const binding = readFileSync(path.join(installed, 'private-bindings.md'), 'utf8');
    const skill = readFileSync(path.join(installed, 'SKILL.md'), 'utf8');
    assert.match(binding, /^Pilot: #\d+ `/m);
    assert.equal(skill.includes('private-bindings.md'), false);
    assert.equal(skill.includes('private/bindings.md'), false);
    assert.deepEqual(INSTALL_SKILL_ROOTS, ['.grok/skills', '.cursor/skills', '.claude/skills', '.agents/skills', '.copilot/skills']);
    assert.equal(BOX_SKILLS_ROOT, '/home/box/agent-data/workflows');
    assert.equal(INSTALLED_BINDING, 'skills/umbrella/private-bindings.md');
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('pre-sync check stays before config load and mirror protection stays', () => {
  const sync = readFileSync(path.join(root, 'scripts/sync-workspace.mjs'), 'utf8');
  const checkAt = sync.indexOf("import('./check-shared-flow.mjs')");
  const configAt = sync.indexOf('const cfg = loadProjectConfig()');
  assert.ok(checkAt > 0 && configAt > checkAt);
  assert.match(sync, /function isMirrorCopy\(dir\)/);
  assert.match(sync, /cpSync\(from, to, \{ recursive: true \}\)/);
});

test('fixture-root installs the binding and leaves an unmarked skill', () => {
  const dest = mkdtempSync(path.join(tmpdir(), 'umbrella-fixture-'));
  try {
    const run = execSync(
      `node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(dest)} --no-vendor --no-swarm`,
      { cwd: root, encoding: 'utf8' },
    );
    assert.match(run, /fixture binding:/);
    assert.match(run, /unmarked non-pack skill left in place/);
    assert.match(run, /skipped personal mirror, rules, and hook config/);
    const binding = readFileSync(path.join(dest, 'umbrella', 'private-bindings.md'), 'utf8');
    const owned = readFileSync(path.join(dest, 'wip-owned', 'SKILL.md'), 'utf8');
    const skill = readFileSync(path.join(dest, 'umbrella', 'SKILL.md'), 'utf8');
    assert.match(binding, /^Pilot: #\d+ `/m);
    assert.match(owned, /owned by another installer/);
    assert.equal(skill.includes('private-bindings.md'), false);
    assert.equal(existsHomeWrite(run), false);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

function existsHomeWrite(log) {
  return /\/\.cursor\/skills|\/\.claude\/skills|\/\.grok\/skills|\/home\/box\/agent-data/.test(log);
}

test('fixture-root does not write outside the fixture when a private overlay is visible', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-sandbox-'));
  const fixture = path.join(sandbox, 'fixture');
  const home = path.join(sandbox, 'home');
  const overlay = path.join(sandbox, 'fixture-overlay');
  const repo = path.join(sandbox, 'sentinel-repo');
  const sentinels = [
    [path.join(home, '.cursor', 'skills', 'home-sentinel', 'SKILL.md'), 'HOME_CURSOR\n'],
    [path.join(home, '.grok', 'skills', 'home-sentinel', 'SKILL.md'), 'HOME_GROK\n'],
    [path.join(repo, '.cursor', 'skills', 'repo-own', 'SKILL.md'), 'REPO_OWN\n'],
    [path.join(repo, '.grok', 'skills', 'share-skip', 'SKILL.md'), 'SHARE_SKIP\n'],
    [path.join(repo, '.grok', 'skills', 'share-skip', '.synced-by-sync-workspace'), 'marker\n'],
    [path.join(repo, 'docs', 'agents', 'kept.txt'), 'AGENTS\n'],
    [path.join(repo, 'docs', 'swarm', 'kept.txt'), 'SWARM\n'],
    [path.join(sandbox, 'outside', 'kept.txt'), 'OUTSIDE\n'],
  ];
  try {
    mkdirSync(fixture, { recursive: true });
    writeFileSync(path.join(fixture, 'umbrella-dirty.txt'), 'dirty-outside-skill\n');
    for (const [file, text] of sentinels) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    }
    mkdirSync(path.join(overlay, 'docs'), { recursive: true });
    writeFileSync(path.join(overlay, 'project.yml'), [
      'overlay_pack: fixture-overlay',
      'workspace:',
      '  skill_targets:',
      '    - { name: sentinel-repo, dirs: [.cursor/skills, .grok/skills], own: [.cursor/skills], skip: [share-skip] }',
      'repos:',
      '  - name: sentinel-repo',
      '    kind: primary',
      '',
    ].join('\n'));
    writeFileSync(path.join(overlay, 'docs', 'PLAN.md'), 'PLAN\n');
    const before = sentinels.map(([file]) => readFileSync(file));
    const run = execSync(
      `node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(fixture)} --no-vendor --no-swarm`,
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, HOME: home, UMBRELLA_FIXTURE_WORKSPACE: sandbox },
      },
    );
    assert.match(run, /fixture binding:/);
    assert.doesNotMatch(run, /docs\/agents\/project.yml|docs\/swarm\/|share sentinel-repo|own   sentinel-repo/);
    sentinels.forEach(([file], i) => {
      assert.deepEqual(readFileSync(file), before[i]);
    });
    assert.equal(readFileSync(path.join(fixture, 'umbrella-dirty.txt'), 'utf8'), 'dirty-outside-skill\n');
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a dirty file inside pack-owned umbrella is kept and the copy is refused', () => {
  const dest = mkdtempSync(path.join(tmpdir(), 'umbrella-dirty-'));
  const dirty = path.join(dest, 'umbrella', 'DIRTY.txt');
  try {
    mkdirSync(path.dirname(dirty), { recursive: true });
    writeFileSync(dirty, 'dirty pack file\n');
    let text = '';
    let status = 0;
    try {
      execSync(`node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(dest)} --no-vendor --no-swarm`, {
        cwd: root,
        encoding: 'utf8',
      });
    } catch (err) {
      status = err.status;
      text = `${err.stdout || ''}${err.stderr || ''}`;
    }
    assert.notEqual(status, 0);
    assert.match(text, /refuse to replace/);
    assert.match(text, /Not deleted/);
    assert.equal(readFileSync(dirty, 'utf8'), 'dirty pack file\n');
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('a clean installed mirror can be copied again', () => {
  const dest = mkdtempSync(path.join(tmpdir(), 'umbrella-clean-'));
  try {
    execSync(`node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(dest)} --no-vendor --no-swarm`, { cwd: root, encoding: 'utf8' });
    const again = execSync(`node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(dest)} --no-vendor --no-swarm`, { cwd: root, encoding: 'utf8' });
    assert.match(again, /fixture binding:/);
    assert.match(readFileSync(path.join(dest, 'umbrella', 'private-bindings.md'), 'utf8'), /^Pilot: #\d+ `/m);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('an identical tree with no baseline is adopted', () => {
  const dest = mkdtempSync(path.join(tmpdir(), 'umbrella-adopt-'));
  try {
    cpSync(path.join(root, 'skills', 'umbrella'), path.join(dest, 'umbrella'), { recursive: true });
    const sourceSkill = readFileSync(path.join(root, 'skills', 'umbrella', 'SKILL.md'));
    execSync(`node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(dest)} --no-vendor --no-swarm`, { cwd: root, encoding: 'utf8' });
    assert.equal(existsSync(path.join(dest, 'umbrella', '.sync-workspace-baseline')), true);
    assert.deepEqual(readFileSync(path.join(dest, 'umbrella', 'SKILL.md')), sourceSkill);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('a differing tree with no baseline is kept and refused', () => {
  const dest = mkdtempSync(path.join(tmpdir(), 'umbrella-differ-'));
  const skill = path.join(dest, 'umbrella', 'SKILL.md');
  try {
    cpSync(path.join(root, 'skills', 'umbrella'), path.join(dest, 'umbrella'), { recursive: true });
    writeFileSync(skill, `${readFileSync(skill, 'utf8')}\nlocal edit\n`);
    const before = readFileSync(skill);
    let status = 0;
    let text = '';
    try {
      execSync(`node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(dest)} --no-vendor --no-swarm`, { cwd: root, encoding: 'utf8' });
    } catch (err) {
      status = err.status;
      text = `${err.stdout || ''}${err.stderr || ''}`;
    }
    assert.notEqual(status, 0);
    assert.match(text, /refuse to replace/);
    assert.deepEqual(readFileSync(skill), before);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('a symlink edit after a clean baseline is kept and refused', () => {
  const dest = mkdtempSync(path.join(tmpdir(), 'umbrella-link-'));
  const link = path.join(dest, 'umbrella', 'extra-link');
  try {
    execSync(`node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(dest)} --no-vendor --no-swarm`, { cwd: root, encoding: 'utf8' });
    symlinkSync('SKILL.md', link);
    const skillBefore = readFileSync(path.join(dest, 'umbrella', 'SKILL.md'));
    let status = 0;
    let text = '';
    try {
      execSync(`node scripts/sync-workspace.mjs --fixture-root ${JSON.stringify(dest)} --no-vendor --no-swarm`, { cwd: root, encoding: 'utf8' });
    } catch (err) {
      status = err.status;
      text = `${err.stdout || ''}${err.stderr || ''}`;
    }
    assert.notEqual(status, 0);
    assert.match(text, /refuse to replace/);
    assert.equal(readlinkSync(link), 'SKILL.md');
    assert.deepEqual(readFileSync(path.join(dest, 'umbrella', 'SKILL.md')), skillBefore);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('generated public archive passes only with an explicit public flag', () => {
  const dest = mkdtempSync(path.join(tmpdir(), 'umbrella-public-cli-'));
  try {
    execSync(`git archive --format=tar HEAD | tar -x -C ${JSON.stringify(dest)}`, { cwd: root, shell: true, encoding: 'utf8' });
    const pub = execSync(`node scripts/check-shared-flow.mjs --public ${JSON.stringify(dest)}`, { cwd: root, encoding: 'utf8' });
    assert.match(pub, /check-shared-flow: OK \(public\)/);
    assert.equal(existsSync(path.join(dest, 'skills', 'umbrella', 'private-bindings.md')), false);
    let status = 0;
    let text = '';
    try {
      execSync(`node scripts/check-shared-flow.mjs ${JSON.stringify(dest)}`, { cwd: root, encoding: 'utf8' });
    } catch (err) {
      status = err.status;
      text = `${err.stdout || ''}${err.stderr || ''}`;
    }
    assert.notEqual(status, 0);
    assert.match(text, /fail closed/);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('public archive omits the private binding and vendor', () => {
  const listed = execSync('git archive --format=tar HEAD | tar -t', { cwd: root, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  assert.equal(listed.includes('private-bindings.md'), false);
  assert.equal(listed.includes('vendor/'), false);
  assert.equal(readFileSync(path.join(root, INSTALLED_BINDING), 'utf8').includes('Pilot:'), true);
});
