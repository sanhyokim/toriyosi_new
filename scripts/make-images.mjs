// OGP画像とアイコンを、サイトと同じからあげ描画エンジンで生成する。
//   node scripts/make-images.mjs   （Playwright が必要）
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer(async (req, res) => {
  try {
    const file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root)) throw new Error('outside');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

let pw;
try { pw = await import('playwright'); } catch { pw = await import('/opt/node22/lib/node_modules/playwright/index.mjs'); }
const browser = await pw.chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});

async function shot(hash, w, h, out, scale = 1) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await p.goto(`http://127.0.0.1:${port}/scripts/og.html${hash}`, { waitUntil: 'networkidle' });
  await p.waitForSelector('body[data-ready]');
  await p.screenshot({ path: out });
  await p.close();
}
await shot('', 1200, 630, 'src/assets/img/og.png');
await shot('#icon', 512, 512, 'src/assets/img/icon-512.png');
await shot('#icon', 512, 512, 'src/assets/img/logo.png');
await shot('#icon', 180, 180, 'src/assets/img/apple-touch-icon.png', 1);
await browser.close();
server.close();
console.log('images written to src/assets/img/');
