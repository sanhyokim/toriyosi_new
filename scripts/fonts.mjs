// Google Fonts から、サイトで実際に使う文字だけを含むサブセットを取得してセルフホストする。
// 和文フォントは1書体で数MBあるため、表示を止めないよう必要な文字だけに絞る。
//   node build.mjs && node scripts/fonts.mjs && node build.mjs
// 文言を変えたら再実行すること（含まれない文字はシステムフォントで表示される）。
import { readFile, writeFile, readdir, stat, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const OUT = 'src/assets/fonts';

const htmls = [];
async function walk(d) { for (const f of await readdir(d)) { const p = join(d, f); (await stat(p)).isDirectory() ? await walk(p) : p.endsWith('.html') && htmls.push(p); } }
await walk('dist');
let text = '';
for (const f of htmls) text += (await readFile(f, 'utf8')).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
// JS 内で表示する文字（擬音・ボタン文言など）
text += 'ジュワッサクッカリッじゅわ〜コピーしました選択揚げたて準備中…送信できませんでした' + (await readFile('src/data.mjs', 'utf8'));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)).join('');
const base = range(0x20, 0x7e) + range(0x3041, 0x3096) + range(0x30a1, 0x30fc) + '、。・「」『』（）！？ー〜…×＝／：％　';
const chars = [...new Set([...base, ...text].filter((c) => c.codePointAt(0) >= 0x20 && !/\s/.test(c) || c === ' '))].sort();
const latin = range(0x20, 0x7e) + '°×–—…→←↓↑©';
console.log(`unique chars: ${chars.length}`);

const families = [
  { family: 'Dela Gothic One', weights: [400], set: chars, file: 'dela' },
  { family: 'Zen Kaku Gothic New', weights: [400, 700, 900], set: chars, file: 'zenkaku' },
  { family: 'Martian Mono', weights: [400, 600], set: [...latin], file: 'martian' },
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
let css = '/* scripts/fonts.mjs が生成。手で編集しない */\n';
let total = 0;
for (const { family, weights, set, file } of families) {
  for (const w of weights) {
    const chunks = [];
    for (let i = 0; i < set.length; i += 160) chunks.push(set.slice(i, i + 160));
    for (let k = 0; k < chunks.length; k++) {
      const chunk = chunks[k].join('');
      const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${w}&text=${encodeURIComponent(chunk)}&display=swap`;
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`${family} ${w}: ${res.status}`);
      const sheet = await res.text();
      const src = (sheet.match(/url\((https:[^)]+)\)/) || [])[1];
      if (!src) throw new Error(`no src for ${family} ${w}`);
      const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer());
      const name = `${file}-${w}-${k}.woff2`;
      await writeFile(join(OUT, name), buf);
      total += buf.length;
      const ur = [...new Set([...chunk].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase()))].join(',');
      css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url(../fonts/${name}) format("woff2");unicode-range:${ur}}\n`;
    }
  }
}
await writeFile('src/assets/css/fonts.css', css);
console.log(`fonts: ${(total / 1024).toFixed(0)} KiB total → ${OUT}`);
