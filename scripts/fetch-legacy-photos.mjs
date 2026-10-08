// 旧サイト（WordPress）の写真を src/assets/photos/ にダウンロードする。
// 写真が置かれた商品・店舗は、手続き生成のイラストの代わりに写真が表示される（build.mjs が自動判定）。
//   node scripts/fetch-legacy-photos.mjs && npm run build
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { flavors, menu, shops } from '../src/data.mjs';

const items = [...flavors, ...menu, ...shops].filter((x) => x.photo && x.legacyPhoto);
await mkdir('src/assets/photos', { recursive: true });
for (const { photo, legacyPhoto } of items) {
  try {
    const res = await fetch(legacyPhoto);
    if (!res.ok) throw new Error(String(res.status));
    await writeFile(join('src/assets/photos', photo), Buffer.from(await res.arrayBuffer()));
    console.log('✓', photo);
  } catch (e) {
    console.log('✗', photo, legacyPhoto, e.message);
  }
}
