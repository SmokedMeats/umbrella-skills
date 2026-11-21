import { spawnSync } from 'node:child_process';
import { gitEnv } from './sync-freshness.mjs';

export const BINDING_REL = 'skills/umbrella/private-bindings.md';

/** Whether HEAD tracks the private binding. gitEnv() clears GIT_DIR and friends so an inherited location cannot flip this. */
export function tracksBinding(cwd, env = process.env) {
  const run = spawnSync('git', ['-C', cwd, 'cat-file', '-e', `HEAD:${BINDING_REL}`], {
    encoding: 'utf8',
    env: gitEnv(env),
  });
  return run.status === 0;
}
