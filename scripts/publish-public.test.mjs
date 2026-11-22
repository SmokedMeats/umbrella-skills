import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function quotedWord(text, open) {
  if (text[open] !== '"') throw new Error(`expected a double quote at ${open}`);
  let i = open + 1;
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2;
      continue;
    }
    if (text[i] === '"') return text.slice(open, i + 1);
    i += 1;
  }
  throw new Error('unterminated double quote');
}

function commitMessageOperands(script) {
  const operands = [];
  let from = 0;
  while (from < script.length) {
    const at = script.indexOf('git commit', from);
    if (at < 0) break;
    const isTree = script.startsWith('git commit-tree', at);
    const isCommit = script.startsWith('git commit ', at);
    if (!isTree && !isCommit) {
      from = at + 'git commit'.length;
      continue;
    }
    const flag = script.indexOf('-m', at);
    if (flag < 0) throw new Error('git commit is missing -m');
    let i = flag + 2;
    while (script[i] === ' ' || script[i] === '\t') i += 1;
    const operand = quotedWord(script, i);
    operands.push(operand);
    from = i + operand.length;
  }
  return operands;
}

test('publish commits use only the snapshot subject', () => {
  const script = readFileSync(path.join(root, 'scripts/publish-public.sh'), 'utf8');
  const messages = commitMessageOperands(script);
  assert.equal(messages.length, 2);
  for (const message of messages) {
    assert.equal(message, '"${SNAPSHOT_MSG}"');
    assert.equal(message.includes('Public snapshot from '), false);
    assert.equal(message.includes('SRC_SHA'), false);
  }
  const assigned = script.match(/^SNAPSHOT_MSG=(.*)$/m);
  assert.ok(assigned, 'SNAPSHOT_MSG assignment');
  assert.equal(assigned[1], '"Public snapshot refresh: ${TOPIC}"');
});

test('the pull request template describes the public snapshot change', () => {
  const template = readFileSync(path.join(root, '.github/PULL_REQUEST_TEMPLATE.md'), 'utf8');
  assert.match(template, /Public snapshot refresh: <topic>/);
  assert.deepEqual(
    template.split('\n').filter((line) => /^Refs\b/.test(line)),
    [],
  );
  assert.equal(/private/i.test(template), false);
});
