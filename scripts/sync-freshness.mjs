// Sync refuses to copy from or into a stale checkout. Before sync-workspace.mjs
// writes anything, it fetches every pack repo it reads (this pack, the private
// overlay, the swarm pack) and every skill_targets repo it writes, then compares
// each checkout with its upstream branch. Behind, diverged, a failed fetch, or
// no upstream branch stops the sync. Ahead only (unpushed local commits) is fine.
// A folder that is not a git checkout (an archive install) is skipped.
import { existsSync } from 'node:fs';
import path from 'node:path';

const FETCH_TIMEOUT_MS = 60_000;

/**
 * Pure decision for one checkout.
 * @param {{ git: boolean, fetchOk?: boolean, upstream?: string | null, ahead?: number, behind?: number }} facts
 * @returns {{ ok: boolean, state: 'not-git' | 'fetch-failed' | 'no-upstream' | 'equal' | 'ahead' | 'behind' | 'diverged' }}
 */
export function freshnessDecision(facts) {
  if (!facts.git) return { ok: true, state: 'not-git' };
  if (!facts.fetchOk) return { ok: false, state: 'fetch-failed' };
  if (!facts.upstream) return { ok: false, state: 'no-upstream' };
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
  switch (decision.state) {
    case 'not-git': return `fresh: ${name}: not a git checkout; skipped`;
    case 'equal': return `fresh: ${name}: up to date with ${up}`;
    case 'ahead': return `fresh: ${name}: ${facts.ahead} ahead of ${up} (unpushed commits are fine)`;
    case 'behind': return `sync: refuse: ${name} is ${facts.behind} behind ${up}. Pull it (git pull --ff-only), then sync again.`;
    case 'diverged': return `sync: refuse: ${name} has diverged from ${up} (${facts.ahead} ahead, ${facts.behind} behind). Fix that checkout by hand, then sync again.`;
    case 'fetch-failed': return `sync: refuse: ${name}: git fetch failed${facts.detail ? ` (${facts.detail})` : ''}. Nothing was copied.`;
    case 'no-upstream': return `sync: refuse: ${name}: the current branch has no upstream branch, so freshness is unknown. Set one (git branch -u origin/<branch>), then sync again.`;
    default: return `sync: refuse: ${name}: ${decision.state}`;
  }
}

/**
 * Thin git wrapper: fetch, then read upstream and ahead/behind counts.
 * @param {string} dir
 * @param {(cmd: string, args: string[], opts: object) => { status: number | null, stdout?: string, stderr?: string, error?: Error }} spawn
 */
export function checkoutFacts(dir, spawn) {
  if (!existsSync(path.join(dir, '.git'))) return { git: false };
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  const run = (args, extra = {}) => spawn('git', ['-C', dir, ...args], { encoding: 'utf8', env, ...extra });
  const fetch = run(['fetch', '--quiet'], { timeout: FETCH_TIMEOUT_MS });
  if (fetch.error || fetch.status !== 0) {
    const detail = String(fetch.error?.message || fetch.stderr || '').trim().split('\n').pop();
    return { git: true, fetchOk: false, detail };
  }
  const up = run(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  if (up.status !== 0) return { git: true, fetchOk: true, upstream: null };
  const upstream = String(up.stdout).trim();
  const counts = run(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
  if (counts.status !== 0) return { git: true, fetchOk: false, detail: String(counts.stderr || '').trim() };
  const [ahead, behind] = String(counts.stdout).trim().split(/\s+/).map(Number);
  return { git: true, fetchOk: true, upstream, ahead, behind };
}

/**
 * Check every checkout; print one line each. Returns true when all may sync.
 * @param {{ name: string, dir: string }[]} repos
 */
export function checkFreshness(repos, spawn, log = console.log, logError = console.error) {
  let ok = true;
  const seen = new Set();
  for (const { name, dir } of repos) {
    const key = path.resolve(dir);
    if (seen.has(key) || !existsSync(key)) continue;
    seen.add(key);
    const facts = checkoutFacts(key, spawn);
    const decision = freshnessDecision(facts);
    const line = freshnessLine(name, facts, decision);
    if (decision.ok) log(line);
    else {
      logError(line);
      ok = false;
    }
  }
  return ok;
}
