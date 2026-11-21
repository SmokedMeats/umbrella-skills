// Sync refuses to copy from or into a stale checkout. Before sync-workspace.mjs
// writes anything, it fetches every pack repo it reads (this pack, the private
// overlay, the swarm pack) and every skill_targets repo it writes, then compares
// each checkout with its upstream branch. Behind, diverged, a failed fetch, a
// detached HEAD, no upstream branch, or an upstream that is gone on the remote
// stops the sync. Ahead only (unpushed local commits) is fine.
// A folder that is not a git checkout (an archive install) is skipped.
// The first failed fetch stops the check (any fetch error: do not wait out the rest).
import { existsSync } from 'node:fs';
import path from 'node:path';

const FETCH_TIMEOUT_MS = 60_000;
// Variables that point git at another repo or index. Inherited from a hook or a
// parent git process, they would make `git -C <dir>` read the wrong checkout.
const GIT_LOCATION_VARS = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_NAMESPACE', 'GIT_PREFIX'];

/** process.env without the git location variables, and with prompts off. */
export function gitEnv(base = process.env) {
  const env = { ...base, GIT_TERMINAL_PROMPT: '0' };
  for (const k of GIT_LOCATION_VARS) delete env[k];
  return env;
}

/**
 * Pure decision for one checkout.
 * @param {{ git: boolean, fetchOk?: boolean, detached?: boolean, upstream?: string | null,
 *   upstreamConfigured?: string | null, ahead?: number, behind?: number }} facts
 * @returns {{ ok: boolean, state: 'not-git' | 'fetch-failed' | 'detached' | 'no-upstream' | 'upstream-gone' | 'equal' | 'ahead' | 'behind' | 'diverged' }}
 */
export function freshnessDecision(facts) {
  if (!facts.git) return { ok: true, state: 'not-git' };
  if (!facts.fetchOk) return { ok: false, state: 'fetch-failed' };
  if (facts.detached) return { ok: false, state: 'detached' };
  if (!facts.upstream) return { ok: false, state: facts.upstreamConfigured ? 'upstream-gone' : 'no-upstream' };
  const ahead = facts.ahead ?? 0;
  const behind = facts.behind ?? 0;
  if (behind > 0 && ahead > 0) return { ok: false, state: 'diverged' };
  if (behind > 0) return { ok: false, state: 'behind' };
  if (ahead > 0) return { ok: true, state: 'ahead' };
  return { ok: true, state: 'equal' };
}

/** One line for a checkout, from its facts and decision. */
export function freshnessLine(name, facts, decision) {
  const up = facts.upstream || 'its upstream';
  const branch = facts.branch ? ` (branch ${facts.branch})` : '';
  switch (decision.state) {
    case 'not-git': return `fresh: ${name}: not a git checkout; skipped`;
    case 'equal': return `fresh: ${name}: up to date with ${up}`;
    case 'ahead': return `fresh: ${name}: ${facts.ahead} ahead of ${up} (unpushed commits are fine)`;
    case 'behind': return `sync: refuse: ${name} is ${facts.behind} behind ${up}. Pull it (git pull --ff-only), then sync again.`;
    case 'diverged': return `sync: refuse: ${name} has diverged from ${up} (${facts.ahead} ahead, ${facts.behind} behind). Fix that checkout by hand, then sync again.`;
    case 'fetch-failed': return `sync: refuse: ${name}: git fetch failed${facts.detail ? ` (${facts.detail})` : ''}. Nothing was copied.`;
    case 'detached': return `sync: refuse: ${name}: HEAD is detached${facts.head ? ` at ${facts.head}` : ''}, so there is no branch to compare. Check out a branch (git switch <branch>), then sync again.`;
    case 'no-upstream': return `sync: refuse: ${name}${branch} has no upstream branch (never pushed?). Push it with git push -u origin HEAD, or set one with git branch -u origin/<branch>, then sync again.`;
    case 'upstream-gone': return `sync: refuse: ${name}${branch}: its upstream ${facts.upstreamConfigured} is gone on the remote (deleted after a merge?). Switch to a live branch or set a new upstream, then sync again.`;
    default: return `sync: refuse: ${name}: ${decision.state}`;
  }
}

/**
 * Thin git wrapper: fetch, then read the branch, its upstream, and ahead/behind counts.
 * @param {string} dir
 * @param {(cmd: string, args: string[], opts: object) => { status: number | null, stdout?: string, stderr?: string, error?: Error }} spawn
 */
export function checkoutFacts(dir, spawn) {
  if (!existsSync(path.join(dir, '.git'))) return { git: false };
  const env = gitEnv();
  const run = (args, extra = {}) => spawn('git', ['-C', dir, ...args], { encoding: 'utf8', env, ...extra });
  const out = (r) => String(r.stdout ?? '').trim();
  const fetch = run(['fetch', '--quiet', '--prune'], { timeout: FETCH_TIMEOUT_MS });
  if (fetch.error || fetch.status !== 0) {
    const detail = String(fetch.error?.message || fetch.stderr || '').trim().split('\n').pop();
    return { git: true, fetchOk: false, detail };
  }
  const sym = run(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  if (sym.status !== 0) {
    const head = run(['rev-parse', '--short', 'HEAD']);
    return { git: true, fetchOk: true, detached: true, head: head.status === 0 ? out(head) : '' };
  }
  const branch = out(sym);
  const up = run(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  if (up.status !== 0) {
    const remote = run(['config', '--get', `branch.${branch}.remote`]);
    const merge = run(['config', '--get', `branch.${branch}.merge`]);
    const configured = remote.status === 0 && merge.status === 0
      ? `${out(remote)}/${out(merge).replace(/^refs\/heads\//, '')}`
      : null;
    return { git: true, fetchOk: true, branch, upstream: null, upstreamConfigured: configured };
  }
  const upstream = out(up);
  const counts = run(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
  if (counts.status !== 0) return { git: true, fetchOk: false, detail: String(counts.stderr || '').trim() };
  const [ahead, behind] = out(counts).split(/\s+/).map(Number);
  return { git: true, fetchOk: true, branch, upstream, ahead, behind };
}

/**
 * Check every checkout; print one line each. Returns true when all may sync.
 * Stops at the first failed fetch (network, auth, timeout, or any other
 * non-zero fetch) and names the repos it did not try. Each further fetch
 * could wait out its own timeout.
 * @param {{ name: string, dir: string }[]} repos
 */
export function checkFreshness(repos, spawn, log = console.log, logError = console.error) {
  let ok = true;
  const seen = new Set();
  const todo = repos
    .map(({ name, dir }) => ({ name, dir: path.resolve(dir) }))
    .filter(({ dir }) => !seen.has(dir) && seen.add(dir) && existsSync(dir));
  for (let i = 0; i < todo.length; i++) {
    const { name, dir } = todo[i];
    const facts = checkoutFacts(dir, spawn);
    const decision = freshnessDecision(facts);
    const line = freshnessLine(name, facts, decision);
    if (decision.ok) {
      log(line);
      continue;
    }
    logError(line);
    ok = false;
    if (decision.state === 'fetch-failed' && i + 1 < todo.length) {
      logError(`sync: stopped checking after the failed fetch; not tried: ${todo.slice(i + 1).map((r) => r.name).join(', ')}.`);
      break;
    }
  }
  return ok;
}
