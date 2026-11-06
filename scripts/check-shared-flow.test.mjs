import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
  checkSharedFlow,
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
  assert.equal(pack.bindingPresent, true);
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
  docs.bindingPresent = false;
  const problems = sharedFlowProblems(docs);
  assert.equal(problems.some((problem) => problem.includes('fail closed')), false);
  assert.equal(problems.some((problem) => problem.includes('must omit private bindings')), false);
});

test('public mode refuses an empty binding file', () => {
  const docs = syntheticPack();
  docs.packMode = 'public';
  docs.privateBindings = '';
  docs.bindingPresent = true;
  const problems = sharedFlowProblems(docs);
  assert.ok(problems.some((problem) => problem.includes('public archive must omit private bindings')));
});

test('an invalid pack mode is rejected before the pack is read', () => {
  const missing = path.join(tmpdir(), `umbrella-no-such-pack-${process.pid}`);
  rmSync(missing, { recursive: true, force: true });
  const failures = checkSharedFlow(missing, { packMode: 'inferred' });
  assert.deepEqual(failures, [{ skill: 'shared-flow', problems: ['unknown pack mode inferred'] }]);
  assert.equal(existsSync(missing), false);
  assert.deepEqual(checkSharedFlow(missing, { packMode: 'PUBLIC' }), [{ skill: 'shared-flow', problems: ['unknown pack mode PUBLIC'] }]);
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
    assert.match(run, /skipped personal mirror, rules, hook config, project.yml, standing rules, skills-overlay, and swarm docs/);
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
    assert.equal(existsSync(path.join(fixture, 'project.yml')), false);
    assert.equal(existsSync(path.join(fixture, 'standing-product-rules.md')), false);
    assert.equal(existsSync(path.join(repo, 'docs', 'agents', 'project.yml')), false);
    assert.equal(existsSync(path.join(repo, 'docs', 'swarm', 'areas.yml')), false);
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

// Listing only. A public export does not contain the binding file, so this
// check must not read it. Source presence stays in the source-pack tests.
test('public archive omits the private binding and vendor', () => {
  const listed = execSync('git archive --format=tar HEAD | tar -t', { cwd: root, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  assert.equal(listed.includes('private-bindings.md'), false);
  assert.equal(listed.includes('vendor/'), false);
});

const SYNTHETIC_BINDING = [
  'Pilot: #999 `docs/specs/models/example/` (PR #1000).',
  'Before a sample card moves to Ready to merge',
  '',
].join('\n');

function copyPack(dir) {
  cpSync(root, dir, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(root, src);
      if (!rel) return true;
      const parts = rel.split(path.sep);
      return !parts.includes('.git') && parts[0] !== 'vendor';
    },
  });
}

function childEnv(home) {
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  delete env.UMBRELLA_SWARM;
  delete env.UMBRELLA_OVERLAY;
  delete env.UMBRELLA_FIXTURE_WORKSPACE;
  delete env.UMBRELLA_BOX_SKILLS_ROOT;
  return env;
}

function runSync(pack, args, home) {
  let status = 0;
  let text = '';
  try {
    text = execSync(`node scripts/sync-workspace.mjs ${args}`, {
      cwd: pack,
      encoding: 'utf8',
      env: childEnv(home),
    });
  } catch (err) {
    status = err.status === null || err.status === undefined ? 1 : err.status;
    text = `${err.stdout || ''}${err.stderr || ''}`;
  }
  return { status, text };
}

function skillDirNames(dir) {
  return readdirSync(dir)
    .filter((name) => existsSync(path.join(dir, name, 'SKILL.md')))
    .sort();
}

test('missing binding does not select public mode and does not create the fixture', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-pub-neg-'));
  const pack = path.join(sandbox, 'pack');
  const fixture = path.join(sandbox, 'fixture');
  const home = path.join(sandbox, 'home');
  try {
    copyPack(pack);
    rmSync(path.join(pack, INSTALLED_BINDING), { force: true });
    mkdirSync(home);
    const run = runSync(pack, `--fixture-root ${JSON.stringify(fixture)} --no-vendor --no-swarm`, home);
    assert.notEqual(run.status, 0);
    assert.match(run.text, /required binding missing; fail closed/);
    assert.equal(existsSync(fixture), false);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
    const failures = checkSharedFlow(pack);
    const explicit = checkSharedFlow(pack, { packMode: 'source' });
    assert.deepEqual(explicit, failures);
    assert.ok(failures.some((row) => row.problems.some((problem) => problem.includes('fail closed'))));
    assert.equal(failures.some((row) => row.problems.some((problem) => problem.includes('must omit private bindings'))), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('explicit --public installs the 22 overlay skills when the binding file is absent', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-pub-pos-'));
  const pack = path.join(sandbox, 'pack');
  const fixture = path.join(sandbox, 'fixture');
  const home = path.join(sandbox, 'home');
  try {
    copyPack(pack);
    rmSync(path.join(pack, INSTALLED_BINDING), { force: true });
    mkdirSync(home);
    const run = runSync(pack, `--public --fixture-root ${JSON.stringify(fixture)} --no-vendor --no-swarm`, home);
    assert.equal(run.status, 0, run.text);
    assert.match(run.text, /fixture binding: omitted/);
    const installed = skillDirNames(fixture).filter((name) => name !== 'wip-owned');
    assert.deepEqual(installed, skillDirNames(path.join(pack, 'skills')));
    assert.equal(installed.length, 22);
    assert.equal(existsSync(path.join(fixture, 'umbrella', 'private-bindings.md')), false);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
    assert.deepEqual(checkSharedFlow(pack, { packMode: 'public' }), []);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('public mode refuses a pack that still has the binding file', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-pub-refuse-'));
  const pack = path.join(sandbox, 'pack');
  const fixture = path.join(sandbox, 'fixture');
  const home = path.join(sandbox, 'home');
  try {
    copyPack(pack);
    mkdirSync(path.dirname(path.join(pack, INSTALLED_BINDING)), { recursive: true });
    writeFileSync(path.join(pack, INSTALLED_BINDING), SYNTHETIC_BINDING);
    mkdirSync(home);
    const run = runSync(pack, `--public --fixture-root ${JSON.stringify(fixture)} --no-vendor --no-swarm`, home);
    assert.notEqual(run.status, 0);
    assert.match(run.text, /public archive must omit private bindings/);
    assert.doesNotMatch(run.text, /fixture binding: omitted/);
    assert.equal(existsSync(fixture), false);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('public mode refuses an empty binding file before copy', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-pub-empty-'));
  const pack = path.join(sandbox, 'pack');
  const fixture = path.join(sandbox, 'fixture');
  const home = path.join(sandbox, 'home');
  try {
    copyPack(pack);
    writeFileSync(path.join(pack, INSTALLED_BINDING), '');
    mkdirSync(home);
    const run = runSync(pack, `--public --fixture-root ${JSON.stringify(fixture)} --no-vendor --no-swarm`, home);
    assert.notEqual(run.status, 0);
    assert.match(run.text, /public archive must omit private bindings/);
    assert.equal(existsSync(fixture), false);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('source mode copies a present binding file and still fails closed when that file is removed', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-src-bind-'));
  const pack = path.join(sandbox, 'pack');
  const fixture = path.join(sandbox, 'fixture');
  const home = path.join(sandbox, 'home');
  const gone = path.join(sandbox, 'gone');
  try {
    copyPack(pack);
    writeFileSync(path.join(pack, INSTALLED_BINDING), SYNTHETIC_BINDING);
    mkdirSync(home);
    const run = runSync(pack, `--fixture-root ${JSON.stringify(fixture)} --no-vendor --no-swarm`, home);
    assert.equal(run.status, 0, run.text);
    assert.equal(readFileSync(path.join(fixture, 'umbrella', 'private-bindings.md'), 'utf8'), SYNTHETIC_BINDING);
    assert.match(run.text, /fixture binding:/);
    rmSync(path.join(pack, INSTALLED_BINDING));
    const again = runSync(pack, `--fixture-root ${JSON.stringify(gone)} --no-vendor --no-swarm`, home);
    assert.notEqual(again.status, 0);
    assert.match(again.text, /required binding missing; fail closed/);
    assert.equal(existsSync(gone), false);
    assert.equal(existsSync(path.join(home, '.cursor', 'skills')), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('public default install copies 22 skills when vendor and swarm are absent', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-pub-default-'));
  const pack = path.join(sandbox, 'pack');
  const home = path.join(sandbox, 'home');
  const expected = [];
  try {
    copyPack(pack);
    rmSync(path.join(pack, INSTALLED_BINDING), { force: true });
    expected.push(...skillDirNames(path.join(pack, 'skills')));
    mkdirSync(home);
    const run = runSync(pack, '--public', home);
    assert.equal(run.status, 0, run.text);
    assert.match(run.text, /Vendored packs: \(none in this clone/);
    assert.match(run.text, /Swarm pack: \(none found/);
    assert.equal(run.text.includes('/home/ubuntu'), false);
    assert.equal(run.text.includes('/home/box'), false);
    assert.equal(expected.length, 22);
    for (const rel of ['.grok/skills', '.cursor/skills', '.claude/skills', '.agents/skills', '.copilot/skills']) {
      const dest = path.join(home, rel);
      assert.deepEqual(skillDirNames(dest), expected);
      assert.equal(existsSync(path.join(dest, 'umbrella', 'private-bindings.md')), false);
      assert.equal(existsSync(path.join(dest, 'ask-matt', 'SKILL.md')), false);
    }
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

const DEVICE_QA_HOME = ['.grok/skills', '.cursor/skills', '.claude/skills', '.agents/skills', '.copilot/skills'];
const DEVICE_QA_REPO = ['.grok/skills', '.claude/skills', '.cursor/skills'];
const OVERLAY_NOTE = 'adapter device-qa note\n';
const OVERLAY_REVISED = 'adapter device-qa note revised\n';

function deviceQaDirs(home, repo) {
  return [
    ...DEVICE_QA_HOME.map((rel) => path.join(home, rel, 'device-qa-agent')),
    ...DEVICE_QA_REPO.map((rel) => path.join(repo, rel, 'device-qa-agent')),
  ];
}

function snapshotTree(dir) {
  const out = new Map();
  const walk = (rel) => {
    const abs = rel ? path.join(dir, rel) : dir;
    for (const ent of readdirSync(abs, { withFileTypes: true })) {
      const child = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = path.join(dir, child);
      if (ent.isDirectory()) walk(child);
      else if (ent.isFile()) out.set(child, readFileSync(childAbs));
      else if (ent.isSymbolicLink()) out.set(child, Buffer.from(`symlink:${readlinkSync(childAbs)}`));
    }
  };
  if (existsSync(dir)) walk('');
  return out;
}

function snapshotsEqual(left, right) {
  if (left.size !== right.size) return false;
  for (const [key, value] of left) {
    const other = right.get(key);
    if (!other || !value.equals(other)) return false;
  }
  return true;
}

function layRepeatSyncWorkspace(sandbox) {
  const pack = path.join(sandbox, 'pack');
  const home = path.join(sandbox, 'home');
  const repo = path.join(sandbox, 'fake-product');
  const overlay = path.join(sandbox, 'adapter-overlay');
  const swarm = path.join(sandbox, 'umbrella-swarm');
  const agents = path.join(repo, '.agents', 'skills', 'owned-note');
  const wip = path.join(repo, '.cursor', 'skills', 'wip-unmarked');
  copyPack(pack);
  writeFileSync(path.join(pack, INSTALLED_BINDING), SYNTHETIC_BINDING);
  mkdirSync(home);
  mkdirSync(path.join(overlay, 'skills-overlay', 'device-qa-agent'), { recursive: true });
  mkdirSync(path.join(overlay, 'docs'), { recursive: true });
  writeFileSync(path.join(overlay, 'skills-overlay', 'device-qa-agent', 'ADAPTER.md'), OVERLAY_NOTE);
  writeFileSync(path.join(overlay, 'project.yml'), [
    'overlay_pack: adapter-overlay',
    'workspace:',
    '  skill_targets:',
    '    - { name: fake-product, dirs: [.grok/skills, .claude/skills, .cursor/skills], own: [.agents/skills] }',
    'repos:',
    '  - name: fake-product',
    '    kind: primary',
    '',
  ].join('\n'));
  writeFileSync(path.join(overlay, 'docs', 'standing-product-rules.md'), 'generic standing\n');
  writeFileSync(path.join(overlay, 'areas.yml'), 'areas: generic\n');
  for (const name of ['swarmy', 'swarmy-mode']) {
    mkdirSync(path.join(swarm, 'skills', name), { recursive: true });
    writeFileSync(path.join(swarm, 'skills', name, 'SKILL.md'), `---\nname: ${name}\n---\nlocal stand-in\n`);
  }
  mkdirSync(agents, { recursive: true });
  writeFileSync(path.join(agents, 'SKILL.md'), 'owned note\n');
  writeFileSync(path.join(agents, 'notes.txt'), 'dirty notes\n');
  mkdirSync(wip, { recursive: true });
  writeFileSync(path.join(wip, 'SKILL.md'), 'unmarked wip\n');
  return { pack, home, repo, overlay, agents, wip };
}

test('repeated sync keeps an overlay merge clean and preserves owned originals', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-repeat-'));
  try {
    const { pack, home, repo, agents, wip } = layRepeatSyncWorkspace(sandbox);
    const agentsBefore = snapshotTree(agents);
    const wipBefore = readFileSync(path.join(wip, 'SKILL.md'));
    const first = runSync(pack, '--no-rules --no-vendor', home);
    assert.equal(first.status, 0, first.text);
    const dirs = deviceQaDirs(home, repo);
    assert.equal(dirs.length, 8);
    for (const dir of dirs) assert.equal(readFileSync(path.join(dir, 'ADAPTER.md'), 'utf8'), OVERLAY_NOTE);
    const baseline = readFileSync(path.join(home, '.cursor', 'skills', 'device-qa-agent', '.sync-workspace-baseline'));
    const projectBytes = readFileSync(path.join(sandbox, 'adapter-overlay', 'project.yml'));
    const standingBytes = readFileSync(path.join(sandbox, 'adapter-overlay', 'docs', 'standing-product-rules.md'));
    const areasBytes = readFileSync(path.join(sandbox, 'adapter-overlay', 'areas.yml'));
    const configDests = [
      ...DEVICE_QA_HOME.map((rel) => path.join(home, rel)),
      ...DEVICE_QA_REPO.map((rel) => path.join(repo, rel)),
      path.join(repo, 'docs', 'agents'),
    ];
    const assertConfigParity = () => {
      for (const dest of configDests) {
        assert.deepEqual(readFileSync(path.join(dest, 'project.yml')), projectBytes);
        assert.deepEqual(readFileSync(path.join(dest, 'standing-product-rules.md')), standingBytes);
      }
      assert.deepEqual(readFileSync(path.join(repo, 'docs', 'swarm', 'areas.yml')), areasBytes);
    };
    assertConfigParity();
    const second = runSync(pack, '--no-rules --no-vendor', home);
    assert.equal(second.status, 0, second.text);
    assert.equal(second.text.includes('refuse to replace'), false);
    assertConfigParity();
    assert.deepEqual(readFileSync(path.join(home, '.cursor', 'skills', 'device-qa-agent', '.sync-workspace-baseline')), baseline);
    for (const dir of dirs) assert.equal(readFileSync(path.join(dir, 'ADAPTER.md'), 'utf8'), OVERLAY_NOTE);
    assert.equal(snapshotsEqual(snapshotTree(agents), agentsBefore), true);
    assert.equal(existsSync(path.join(agents, '.synced-by-sync-workspace')), false);
    assert.deepEqual(readFileSync(path.join(wip, 'SKILL.md')), wipBefore);
    const mirrored = path.join(repo, '.grok', 'skills', 'owned-note');
    assert.equal(readFileSync(path.join(mirrored, 'SKILL.md'), 'utf8'), 'owned note\n');
    assert.equal(existsSync(path.join(mirrored, '.synced-by-sync-workspace')), true);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('dirty pack and overlay edits stay put while a changed overlay updates clean copies', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'umbrella-dirty-overlay-'));
  try {
    const { pack, home, repo, overlay, agents } = layRepeatSyncWorkspace(sandbox);
    const agentsBefore = snapshotTree(agents);
    const first = runSync(pack, '--no-rules --no-vendor', home);
    assert.equal(first.status, 0, first.text);
    const implement = path.join(repo, '.cursor', 'skills', 'implement', 'SKILL.md');
    const dirtyQa = path.join(home, '.cursor', 'skills', 'device-qa-agent');
    writeFileSync(implement, `${readFileSync(implement, 'utf8')}local edit\n`);
    writeFileSync(path.join(dirtyQa, 'USER.md'), 'user edit\n');
    const implementBefore = readFileSync(implement);
    const dirtyBefore = snapshotTree(dirtyQa);
    writeFileSync(path.join(overlay, 'skills-overlay', 'device-qa-agent', 'ADAPTER.md'), OVERLAY_REVISED);
    const again = runSync(pack, '--no-rules --no-vendor', home);
    assert.equal(again.status, 1, again.text);
    const refuses = again.text.split('\n').filter((line) => line.includes('refuse to replace'));
    assert.equal(refuses.length, 2, again.text);
    assert.equal(refuses.some((line) => line.includes('/implement (dirty)')), true);
    assert.equal(refuses.some((line) => line.includes('/device-qa-agent (dirty)')), true);
    assert.deepEqual(readFileSync(implement), implementBefore);
    assert.equal(snapshotsEqual(snapshotTree(dirtyQa), dirtyBefore), true);
    assert.equal(snapshotsEqual(snapshotTree(agents), agentsBefore), true);
    for (const dir of deviceQaDirs(home, repo)) {
      if (dir === dirtyQa) continue;
      assert.equal(readFileSync(path.join(dir, 'ADAPTER.md'), 'utf8'), OVERLAY_REVISED);
      assert.equal(existsSync(path.join(dir, 'USER.md')), false);
    }
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
