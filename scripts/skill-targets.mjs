/**
 * workspace.skill_targets rows from project.yml, and which skills a row may hold.
 *
 *   skill_targets:
 *     - { name: Foo, dirs: [.cursor/skills], own: [.grok/skills], rules: "node scripts/x.mjs", skip: [gh-mix] }
 *     - { name: Bar, dirs: [.claude/skills], only: [implement, tdd] }
 *
 * own, rules, skip and only are optional.
 * skip: skills that repo never receives.
 * only: the complete list of synced skills that repo receives (pack, swarm, shared and
 *   personal). Every other synced copy there is removed by sync. The repo's own originals
 *   always stay. With both, a skill must be in only and not in skip.
 */

function listField(line, key) {
  const m = line.match(new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`));
  if (!m) return null;
  return m[1].split(',').map((s) => s.trim()).filter(Boolean);
}

export function parseSkillTargets(raw) {
  const targets = [];
  const block = raw.match(/skill_targets:\s*\n((?:[ \t]+-.+\n?)+)/);
  if (!block) return targets; // no rows: user-global only
  for (const line of block[1].split('\n')) {
    const m = line.match(/name:\s*([^,}\s]+).*dirs:\s*\[([^\]]*)\]/);
    if (!m) continue;
    targets.push({
      repo: m[1].trim(),
      dirs: m[2].split(',').map((s) => s.trim()).filter(Boolean),
      own: listField(line, 'own') || [],
      rules: line.match(/rules:\s*"([^"]*)"/)?.[1] || null,
      skip: listField(line, 'skip') || [],
      only: listField(line, 'only'),
    });
  }
  return targets;
}

/** True when sync may put a copy of `name` into this row's folders. */
export function rowAllows(row, name) {
  if (row.skip.includes(name)) return false;
  return row.only === null || row.only.includes(name);
}
