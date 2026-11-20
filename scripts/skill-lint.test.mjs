import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { lintPack, lintRelativeLinks, lintSkillText, parseFrontmatter } from './skill-lint.mjs';

const pack = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function skill(name, description, extra = '') {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\n${extra}`;
}

function git(cwd, args) {
  const run = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  return (run.stdout || '').trim();
}

function commitRepo(dir) {
  git(dir, ['init', '-b', 'main']);
  git(dir, ['config', 'user.email', 'skill-lint@local']);
  git(dir, ['config', 'user.name', 'skill-lint']);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-m', 'pack']);
}

test('a skill with a matching name and a Use when trigger passes', () => {
  const result = lintSkillText('grilling', skill('grilling', '"Stress-test a plan. Use when the user says grill."'));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('a folded description still sees the Use when trigger', () => {
  const text = '---\nname: build-verifier\ndescription: >\n  Use when the land gate is high.\n  Readonly audit.\n---\n\n# Build verifier\n';
  const fm = parseFrontmatter(text);
  assert.match(fm.description, /^Use when the land gate is high\. Readonly audit\.$/);
  assert.deepEqual(lintSkillText('build-verifier', text).errors, []);
});

test('a frontmatter name that does not match the folder fails', () => {
  const result = lintSkillText('why', skill('why-not', '"Explain a choice. Use when asked why."'));
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /does not match directory name 'why'/);
  assert.deepEqual(result.warnings, []);
});

test('a missing description fails', () => {
  const result = lintSkillText('how', '---\nname: how\n---\n\n# How\n');
  assert.match(result.errors.join('\n'), /missing required field: 'description'/);
});

test('a description over 1024 characters fails', () => {
  const description = `"Use when asked. ${'x'.repeat(1024)}"`;
  const result = lintSkillText('how', skill('how', description));
  assert.match(result.errors.join('\n'), /exceeds the 1024-char limit/);
});

test('a description with no when-to-use trigger fails', () => {
  const result = lintSkillText('how', skill('how', '"Explain a subsystem. Use for a walkthrough."'));
  assert.match(result.errors.join('\n'), /no 'when to use' trigger/);
});

test('a description whose only trigger is negated fails', () => {
  const result = lintSkillText('how', skill('how', '"Do not use when debugging. Explains a subsystem."'));
  assert.match(result.errors.join('\n'), /no 'when to use' trigger/);
});

test('a negated clause plus a real Use when trigger passes', () => {
  const result = lintSkillText('how', skill('how', '"Do not use when debugging. Use when asked how a subsystem works."'));
  assert.deepEqual(result.errors, []);
});

test('a SKILL.md over 500 lines warns and does not fail', () => {
  const text = `${skill('why', '"Explain a choice. Use when asked why."')}${'\n'.repeat(500)}`;
  const result = lintSkillText('why', text);
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /over the 500-line budget/);
});

test('a SKILL.md of 500 lines does not warn', () => {
  const body = skill('why', '"Explain a choice. Use when asked why."');
  const lines = (body.match(/\n/g) || []).length;
  const text = `${body}${'\n'.repeat(500 - lines)}`;
  assert.equal((text.match(/\n/g) || []).length, 500);
  assert.deepEqual(lintSkillText('why', text).warnings, []);
});

test('a relative link that exists passes, and a missing one fails', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'skill-lint-'));
  try {
    const skillDir = path.join(sandbox, 'skills', 'how');
    mkdirSync(path.join(skillDir, 'notes'), { recursive: true });
    writeFileSync(path.join(skillDir, 'notes', 'there.md'), '# there\n');
    const file = path.join(skillDir, 'SKILL.md');
    const content = `${skill('how', '"Explain. Use when asked."')}\nSee [there](notes/there.md) and [gone](notes/gone.md) and [web](https://example.com/x).\n`;
    writeFileSync(file, content);
    const errors = lintRelativeLinks(content, file, sandbox, []);
    assert.deepEqual(errors, ['Relative link does not resolve: notes/gone.md']);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a template slot and a fenced example link are not errors', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'skill-lint-'));
  try {
    const skillDir = path.join(sandbox, 'skills', 'to-tickets');
    mkdirSync(skillDir, { recursive: true });
    const file = path.join(skillDir, 'SKILL.md');
    const content = `${skill('to-tickets', '"Break a spec into tickets. Use when a spec exists."')}\n- Spec: [spec title](url)\n\n\`\`\`\n[missing](./nope.md)\n\`\`\`\n`;
    const errors = lintRelativeLinks(content, file, sandbox, []);
    assert.deepEqual(errors, []);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('the codebase-design allowlist does not fail the implement link', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'skill-lint-'));
  try {
    const skillDir = path.join(sandbox, 'skills', 'implement');
    mkdirSync(skillDir, { recursive: true });
    const file = path.join(skillDir, 'SKILL.md');
    const content = `${skill('implement', '"Build tickets. Use when tickets exist."')}\nRead [codebase-design](../codebase-design/SKILL.md).\n`;
    writeFileSync(file, content);
    commitRepo(sandbox);
    const result = lintPack(sandbox);
    assert.deepEqual(result.errors, []);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('the same missing link fails when it is not allowlisted', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'skill-lint-'));
  try {
    const skillDir = path.join(sandbox, 'skills', 'implement');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `${skill('implement', '"Build tickets. Use when tickets exist."')}\nRead [other](../other/SKILL.md).\n`,
    );
    commitRepo(sandbox);
    const result = lintPack(sandbox, { allow: [] });
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /Relative link does not resolve: \.\.\/other\/SKILL\.md/);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('a gitignored or untracked file does not satisfy a link', () => {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'skill-lint-'));
  try {
    const skillDir = path.join(sandbox, 'skills', 'how', 'notes');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(path.join(skillDir, 'kept.md'), '# kept\n');
    writeFileSync(path.join(sandbox, '.gitignore'), 'skills/how/notes/ignored.md\n');
    writeFileSync(
      path.join(sandbox, 'skills', 'how', 'SKILL.md'),
      `${skill('how', '"Explain. Use when asked."')}\nSee [kept](notes/kept.md), [hidden](notes/ignored.md), and [extra](notes/untracked.md).\n`,
    );
    commitRepo(sandbox);
    writeFileSync(path.join(skillDir, 'ignored.md'), '# ignored\n');
    writeFileSync(path.join(skillDir, 'untracked.md'), '# untracked\n');
    const result = lintPack(sandbox, { allow: [] });
    const text = result.errors.join('\n');
    assert.match(text, /Relative link does not resolve: notes\/ignored\.md/);
    assert.match(text, /Relative link does not resolve: notes\/untracked\.md/);
    assert.equal(text.includes('notes/kept.md'), false);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test('the pack skills have no skill-lint errors', () => {
  const result = lintPack(pack);
  assert.deepEqual(result.errors, [], result.errors.join('\n'));
  assert.deepEqual(result.warnings, []);
});
