// dist/ の品質チェック: h1・title・description・canonical・JSON-LD・内部リンク・alt・lang。
//   node scripts/check.mjs [dist]
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
const files = [];
async function walk(d) { for (const f of await readdir(d)) { const p = join(d, f); (await stat(p)).isDirectory() ? await walk(p) : p.endsWith('.html') && files.push(p); } }
await walk(root);

let errors = 0, warns = 0;
const err = (f, m) => { errors++; console.log(`✗ ${f.replace(root, '')}: ${m}`); };
const warn = (f, m) => { warns++; console.log(`△ ${f.replace(root, '')}: ${m}`); };
const titles = new Map(), descs = new Map();

for (const f of files) {
  const h = await readFile(f, 'utf8');
  const rel = f.replace(root, '');
  if (!/<html lang="ja"/.test(h)) err(f, 'lang="ja" がない');
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(f, `h1 が ${h1} 個`);
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) err(f, 'title がない'); else { if ([...title].length > 60) warn(f, `title が長い (${[...title].length}字)`); titles.set(title, [...(titles.get(title) || []), rel]); }
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!desc) err(f, 'description がない'); else { const n = [...desc].length; if (n < 40 || n > 160) warn(f, `description の長さ ${n}字`); descs.set(desc, [...(descs.get(desc) || []), rel]); }
  if (!/rel="canonical" href="https:\/\/toriyoshi\.love\//.test(h)) err(f, 'canonical がない');
  if (!/property="og:image"/.test(h)) err(f, 'og:image がない');
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); if (!j['@context']) err(f, 'JSON-LD に @context がない'); } catch (e) { err(f, `JSON-LD が壊れている: ${e.message}`); }
  }
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) err(f, `alt のない img: ${m[0].slice(0, 60)}`);
  for (const m of h.matchAll(/<canvas\b[^>]*>/g)) if (/role="img"/.test(m[0]) && !/aria-label="/.test(m[0])) err(f, 'aria-label のない canvas[role=img]');
  const ids = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of h.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
    if (u.startsWith('/wp-content/uploads/')) continue; // 今のサーバーに残す旧サイトの写真
    const [path, hash] = u.split('#');
    if (!path) { if (hash && !ids.has(hash)) err(f, `ページ内リンク切れ #${hash}`); continue; }
    let target = resolve(dirname(f), decodeURIComponent(path));
    if (path.endsWith('/') || path === '.' || path === './') target = join(target, 'index.html');
    if (!existsSync(target)) err(f, `リンク切れ ${u}`);
  }
}
for (const [t, fs] of titles) if (fs.length > 1) warn(fs[0], `title 重複: ${t} (${fs.join(', ')})`);
for (const [d, fs] of descs) if (fs.length > 1) warn(fs[0], `description 重複 (${fs.join(', ')})`);
for (const f of ['robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'manifest.webmanifest', 'assets/img/og.png']) if (!existsSync(join(root, f))) err(root, `${f} がない`);
const sm = await readFile(join(root, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const l of locs) { const p = decodeURIComponent(l.replace('https://toriyoshi.love/', '')); if (!existsSync(join(root, p, p.endsWith('.html') ? '' : 'index.html'))) err(root, `sitemap の URL に対応するファイルがない: ${l}`); }
console.log(`\n${files.length} pages, sitemap ${locs.length} URLs — errors: ${errors}, warnings: ${warns}`);
process.exit(errors ? 1 : 0);
