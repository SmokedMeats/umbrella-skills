/**
 * Check every upstream skill source against its newest release and write a diff
 * (what we have -> what upstream has now) for each one that moved. Called by
 * sync-workspace.mjs:
 *
 *   node scripts/sync-workspace.mjs --check-updates   # report + diffs, install nothing
 *   node scripts/sync-workspace.mjs --update          # report + diffs, update the auto
 *                                                     # sources, then the normal sync
 *   add --print to stream every diff to the terminal (default: diffs up to 300 lines)
 *
 * Sources:
 *   review (report only; bump by hand, vendor/README.md "Bump a pin"):
 *     mattpocock-skills, simple-english, pstack-reference  (vendor/pins.json)
 *   auto (--update installs them):
 *     every skill in a product repo's skills-lock.json (npx skills: Stripe, Neon, ...)
 *     graphify (an original folder with .graphify_version in a product repo)
 *
 * Diffs land in updates/<source>.diff (gitignored); each run replaces them.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|ico)$/i;
const PRINT_LIMIT = 300; // diff lines printed per source without --print

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32', ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed: ${(r.stderr || r.stdout || r.error?.message || '').trim().split('\n').pop()}`);
  }
  return r.stdout;
}

function gitLsRemote(repo, ...refs) {
  return run('git', ['ls-remote', ...refs.slice(0, -1), repo, ...refs.slice(-1)]).trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
}

function cloneShallow(repo, dir, { branch, sparse } = {}) {
  const args = ['clone', '-q', '--depth', '1'];
  if (branch) args.push('--branch', branch);
  if (sparse) args.push('--filter=blob:none', '--sparse');
  run('git', [...args, repo, dir]);
  if (sparse) run('git', ['-C', dir, 'sparse-checkout', 'set', ...sparse]);
  return run('git', ['-C', dir, 'rev-parse', 'HEAD']).trim();
}

function copyFiltered(from, to, skip = () => false) {
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true, filter: (src) => path.basename(src) !== '.git' && !skip(src) });
}

function semverTags(rows) {
  return rows
    .map(([, ref]) => ref.replace('refs/tags/', ''))
    .filter((t) => /^v?\d+\.\d+\.\d+$/.test(t))
    .sort((a, b) => {
      const pa = a.replace(/^v/, '').split('.').map(Number);
      const pb = b.replace(/^v/, '').split('.').map(Number);
      return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
    });
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function getBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function checkUpdates({ packRoot, workspaceRoot, targets, apply = false, print = false, label = (p) => p }) {
  const work = mkdtempSync(path.join(tmpdir(), 'umbrella-updates-'));
  const outDir = path.join(packRoot, 'updates');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const results = [];

  // Compare two folders as current/ and latest/ so the diff reads cleanly.
  function diff(name, currentDir, latestDir) {
    const cmp = path.join(work, 'cmp', name);
    mkdirSync(cmp, { recursive: true });
    copyFiltered(currentDir, path.join(cmp, 'current'));
    copyFiltered(latestDir, path.join(cmp, 'latest'));
    const args = ['-c', 'core.quotepath=off', 'diff', '--no-index', '--no-color', '--no-prefix'];
    const full = spawnSync('git', [...args, 'current', 'latest'], { cwd: cmp, encoding: 'utf8', maxBuffer: 1 << 28 });
    if (full.status === 0) return null;
    if (full.status !== 1) throw new Error(`git diff failed: ${full.stderr.trim()}`);
    const stat = spawnSync('git', [...args, '--shortstat', 'current', 'latest'], { cwd: cmp, encoding: 'utf8' }).stdout.trim();
    const file = path.join(outDir, `${name}.diff`);
    writeFileSync(file, full.stdout);
    return { file, stat, text: full.stdout };
  }

  // name: shown in the report; key: the diff file name (updates/<key>.diff).
  async function source(name, kind, fn) {
    const r = { name, key: name.replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, ''), kind, current: '', latest: '', status: 'current', diff: null, note: '' };
    try {
      await fn(r);
    } catch (e) {
      r.status = 'error';
      r.note = e.message;
      if (/fetch failed/.test(e.message) && (process.env.HTTPS_PROXY || process.env.https_proxy)) {
        r.note += '; behind a proxy, rerun with NODE_USE_ENV_PROXY=1';
      }
    }
    results.push(r);
  }

  // ---- review sources: vendored, pinned packs ----
  const vendorRoot = path.join(packRoot, 'vendor');
  const pinsFile = path.join(vendorRoot, 'pins.json');
  const pins = existsSync(pinsFile) ? JSON.parse(readFileSync(pinsFile, 'utf8')) : null;
  if (!pins) {
    results.push({ name: 'vendor/', kind: 'review', status: 'skipped', note: 'no vendor/pins.json in this clone (the public snapshot has no vendor/)' });
  }

  if (pins?.['mattpocock-skills']) {
    await source('mattpocock-skills', 'review', async (r) => {
      const pin = pins['mattpocock-skills'];
      r.current = pin.tag;
      const tags = semverTags(gitLsRemote(pin.repo, '--tags', '--refs', 'refs/tags/*'));
      r.latest = tags.at(-1) || pin.tag;
      if (r.latest === pin.tag) return;
      const src = path.join(work, 'matt');
      cloneShallow(pin.repo, src, { branch: r.latest });
      const manifest = JSON.parse(readFileSync(path.join(src, '.claude-plugin', 'plugin.json'), 'utf8'));
      const latest = path.join(work, 'matt-latest');
      for (const rel of manifest.skills) copyFiltered(path.join(src, rel), path.join(latest, 'skills', path.basename(rel)));
      copyFiltered(path.join(src, '.claude-plugin', 'plugin.json'), path.join(latest, 'plugin.json'));
      copyFiltered(path.join(src, 'LICENSE'), path.join(latest, 'LICENSE'));
      r.diff = diff('mattpocock-skills', path.join(vendorRoot, 'mattpocock-skills'), latest);
      r.status = r.diff ? 'behind' : 'current';
    });
  }

  if (pins?.['simple-english']) {
    await source('simple-english', 'review', async (r) => {
      const pin = pins['simple-english'];
      r.current = pin.commit.slice(0, 7);
      const head = gitLsRemote(pin.repo, 'HEAD')[0]?.[0] || pin.commit;
      r.latest = head.slice(0, 7);
      if (head === pin.commit) return;
      const src = path.join(work, 'simple-english');
      cloneShallow(pin.repo, src);
      const latest = path.join(work, 'simple-english-latest');
      copyFiltered(path.join(src, 'skills', 'simple-english'), path.join(latest, 'skills', 'simple-english'));
      copyFiltered(path.join(src, 'LICENSE'), path.join(latest, 'LICENSE'));
      r.diff = diff('simple-english', path.join(vendorRoot, 'simple-english'), latest);
      r.status = r.diff ? 'behind' : 'current';
    });
  }

  if (pins?.['pstack-reference']) {
    await source('pstack-reference', 'review', async (r) => {
      const pin = pins['pstack-reference'];
      r.current = pin.version;
      const head = gitLsRemote(pin.repo, 'HEAD')[0]?.[0] || pin.commit;
      r.latest = pin.version;
      if (head === pin.commit) return;
      const src = path.join(work, 'pstack');
      cloneShallow(pin.repo, src, { sparse: [pin.path] });
      const upstream = path.join(src, pin.path);
      const manifest = path.join(upstream, '.cursor-plugin', 'plugin.json');
      if (existsSync(manifest)) r.latest = JSON.parse(readFileSync(manifest, 'utf8')).version || r.latest;
      const latest = path.join(work, 'pstack-latest');
      copyFiltered(upstream, latest, (p) => IMAGE_EXT.test(p));
      r.diff = diff('pstack-reference', path.join(vendorRoot, 'pstack-reference', 'source'), latest);
      r.status = r.diff ? 'behind' : 'current';
      if (!r.diff) r.note = `cursor/plugins moved (${head.slice(0, 7)}), pstack unchanged; bump pins.json commit when convenient`;
    });
  }

  // ---- auto sources: npx skills (skills-lock.json) and graphify, per product repo ----
  const repos = targets.filter(({ repo }) => existsSync(path.join(workspaceRoot, repo)));
  const wellKnown = new Map(); // base url -> index
  const githubClones = new Map(); // repo -> dir

  for (const { repo } of repos) {
    const repoRoot = path.join(workspaceRoot, repo);
    const lockFile = path.join(repoRoot, 'skills-lock.json');
    if (!existsSync(lockFile)) continue;
    const lock = JSON.parse(readFileSync(lockFile, 'utf8'));
    for (const [skill, entry] of Object.entries(lock.skills || {})) {
      const installed = path.join(repoRoot, '.agents', 'skills', skill);
      if (!existsSync(installed)) continue;
      await source(`${repo} ${skill}`, 'auto', async (r) => {
        r.current = 'installed';
        const latest = path.join(work, 'lock', repo, skill);
        if (entry.sourceType === 'well-known') {
          const base = (entry.sourceUrl || `https://${entry.source}`).replace(/\/$/, '');
          if (!wellKnown.has(base)) wellKnown.set(base, await getJson(`${base}/.well-known/skills/index.json`));
          const item = wellKnown.get(base).skills.find((s) => s.name === skill);
          if (!item) throw new Error(`${skill} is no longer published at ${base}`);
          for (const f of item.files) {
            const to = path.join(latest, f);
            mkdirSync(path.dirname(to), { recursive: true });
            writeFileSync(to, await getBytes(`${base}/.well-known/skills/${skill}/${f}`));
          }
          r.latest = `${base} (now)`;
          r.install = [entry.sourceUrl || base, skill];
        } else if (entry.sourceType === 'github') {
          const url = `https://github.com/${entry.source}`;
          if (!githubClones.has(url)) {
            const dir = path.join(work, 'gh', entry.source.replace('/', '__'));
            const sha = cloneShallow(url, dir);
            githubClones.set(url, { dir, sha });
          }
          const { dir, sha } = githubClones.get(url);
          const skillDir = entry.skillPath ? path.dirname(path.join(dir, entry.skillPath)) : path.join(dir, 'skills', skill);
          if (!existsSync(skillDir)) throw new Error(`${skill} not found in ${entry.source}`);
          copyFiltered(skillDir, latest);
          r.latest = `${entry.source}@${sha.slice(0, 7)}`;
          r.install = [entry.source, skill];
        } else {
          throw new Error(`unknown sourceType ${entry.sourceType}`);
        }
        r.diff = diff(r.key, installed, latest);
        r.status = r.diff ? 'behind' : 'current';
        if (r.diff && apply) {
          run('npx', ['-y', 'skills@latest', 'add', r.install[0], '-s', r.install[1], '-a', 'codex', '-y', '--copy'], {
            cwd: repoRoot,
            env: { ...process.env, DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1' },
          });
          r.status = 'updated';
        }
      });
    }
  }

  // graphify: every original (unmarked) graphify folder carrying .graphify_version.
  const graphifyDirs = [];
  for (const { repo, dirs, own } of repos) {
    for (const rel of [...new Set([...own, ...dirs, '.agents/skills'])]) {
      const dir = path.join(workspaceRoot, repo, rel, 'graphify');
      if (existsSync(path.join(dir, '.graphify_version')) && !existsSync(path.join(dir, '.synced-by-sync-workspace'))) {
        graphifyDirs.push({ repo, rel, dir });
      }
    }
  }
  if (graphifyDirs.length) {
    let built = null; // { version, home }
    const buildGraphify = (version) => {
      const py = ['python3', 'python'].find((p) => spawnSync(p, ['--version'], { shell: process.platform === 'win32' }).status === 0);
      if (!py) throw new Error('python3 not found; cannot build the new graphify skill for a diff');
      const venv = path.join(work, 'graphify-venv');
      run(py, ['-m', 'venv', venv]);
      const bin = path.join(venv, process.platform === 'win32' ? 'Scripts' : 'bin');
      run(path.join(bin, 'pip'), ['install', '-q', `graphifyy==${version}`]);
      const home = path.join(work, 'graphify-home');
      const proj = path.join(work, 'graphify-proj');
      mkdirSync(proj, { recursive: true });
      for (const platform of ['agents', 'claude']) {
        run(path.join(bin, 'graphify'), ['install', '--platform', platform], { cwd: proj, env: { ...process.env, HOME: home, USERPROFILE: home } });
      }
      return { version, home };
    };
    let latestVersion = null;
    for (const g of graphifyDirs) {
      await source(`${g.repo} graphify (${g.rel})`, 'auto', async (r) => {
        r.current = readFileSync(path.join(g.dir, '.graphify_version'), 'utf8').trim();
        latestVersion ??= (await getJson('https://pypi.org/pypi/graphifyy/json')).info.version;
        r.latest = latestVersion;
        if (r.current === r.latest) return;
        built ??= buildGraphify(latestVersion);
        const variant = g.rel.replace(/\\/g, '/').startsWith('.claude/') ? '.claude' : '.agents';
        const latest = path.join(built.home, variant, 'skills', 'graphify');
        r.diff = diff(r.key, g.dir, latest);
        r.status = r.diff ? 'behind' : 'current';
        if (r.diff && apply) {
          rmSync(g.dir, { recursive: true, force: true });
          cpSync(latest, g.dir, { recursive: true });
          r.status = 'updated';
        }
      });
    }
  }

  // ---- report ----
  console.log(`\nUpstream check (${apply ? 'auto sources updated' : 'nothing installed'}; diffs: ${label(outDir)})`);
  const width = Math.max(...results.map((r) => r.name.length), 10);
  for (const r of results) {
    const ver = r.current || r.latest ? `${r.current} -> ${r.latest}` : '';
    const tail = r.diff ? `  ${r.diff.stat}  ${label(r.diff.file)}` : '';
    console.log(`  ${r.name.padEnd(width)}  ${r.kind.padEnd(6)}  ${r.status.padEnd(7)}  ${ver}${tail}${r.note ? `  (${r.note})` : ''}`);
  }
  const behindReview = results.filter((r) => r.kind === 'review' && r.status === 'behind');
  const behindAuto = results.filter((r) => r.kind === 'auto' && r.status === 'behind');
  if (behindReview.length) console.log('  review: read the diff, then bump by hand (vendor/README.md "Bump a pin", update vendor/pins.json).');
  if (behindAuto.length) console.log('  auto: run sync with --update to install them, then commit the repo folders.');
  if (!behindReview.length && !behindAuto.length && !results.some((r) => r.status === 'error')) console.log('  everything is current.');

  for (const r of results.filter((x) => x.diff)) {
    const lines = r.diff.text.split('\n').length;
    if (print || lines <= PRINT_LIMIT) {
      console.log(`\n===== ${r.name}: ${r.current} -> ${r.latest} =====\n${r.diff.text}`);
    } else {
      console.log(`\n===== ${r.name}: ${lines} diff lines; open ${label(r.diff.file)} (or rerun with --print) =====`);
    }
  }

  rmSync(work, { recursive: true, force: true });
  return results;
}
