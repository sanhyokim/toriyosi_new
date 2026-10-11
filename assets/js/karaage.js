// 鶏好 — procedural karaage renderer (Canvas 2D, no dependencies).
// からあげ1個を「凸凹の高さマップ」として計算し、法線からライティングして描く。
// 塊の形（いくつもの球を滑らかに結合）＋衣のザクザク（多重ノイズ）＋たれの照り（スペキュラ）。
// シード付き乱数なので、同じ入力からは毎回同じからあげが揚がる。

const TAU = Math.PI * 2;

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

// 2D gradient (Perlin) noise。オクターブごとに回転させて格子の向きを隠す。
function makeNoise(seed) {
  const r = rng(seed);
  const P = new Uint8Array(512);
  const GX = new Float32Array(256), GY = new Float32Array(256);
  for (let i = 0; i < 256; i++) { P[i] = i; const a = r() * TAU; GX[i] = Math.cos(a); GY[i] = Math.sin(a); }
  for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = P[i]; P[i] = P[j]; P[j] = t; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const rot = r() * TAU, cr = Math.cos(rot), sr = Math.sin(rot);
  return (x0, y0) => {
    const x = x0 * cr - y0 * sr, y = x0 * sr + y0 * cr;
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const X = xi & 255, Y = yi & 255;
    const g = (h, dx, dy) => GX[h] * dx + GY[h] * dy;
    const n00 = g(P[P[X] + Y], xf, yf), n10 = g(P[P[X + 1] + Y], xf - 1, yf);
    const n01 = g(P[P[X] + Y + 1], xf, yf - 1), n11 = g(P[P[X + 1] + Y + 1], xf - 1, yf - 1);
    const nx0 = n00 + (n10 - n00) * u, nx1 = n01 + (n11 - n01) * u;
    return (nx0 + (nx1 - nx0) * v) * 1.6;
  };
}

// 揚げ色のランプ（暗→明）。
const RAMPS = {
  tare: ['#2A0F03', '#5E2508', '#93460F', '#C2752A', '#E3A24B', '#F8CF85'],
  shio: ['#331506', '#663210', '#9C5E22', '#C88F42', '#E6B96C', '#F8DFA6'],
  base: ['#2A1004', '#5C290B', '#8F5219', '#BE8434', '#E0B05E', '#F6D696'],
  mune: ['#3E1C08', '#774016', '#B17128', '#DCA04A', '#F1C477', '#FDE3AA'],
  kankara: ['#260602', '#561007', '#8A1C0C', '#B73416', '#DB5A28', '#F28A48'],
  ponzu: ['#261004', '#58260A', '#8C4C16', '#BA7B32', '#DDAA58', '#F5D290'],
};
function rampLUT(stops) {
  const cs = stops.map(hex);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = (i / 255) * (cs.length - 1);
    const k = Math.min(cs.length - 2, Math.floor(t)), f = t - k;
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = cs[k][c] + (cs[k + 1][c] - cs[k][c]) * f;
  }
  return lut;
}
const LUTS = {};
const lutFor = (name) => (LUTS[name] ||= rampLUT(RAMPS[name] || RAMPS.base));

// 味ごとの仕上げ。gloss=照り、rough=衣のザクザク感、shape=形。
const GLAZES = {
  tare: { ramp: 'tare', gloss: 0.8, rough: 1 },
  pepper: { ramp: 'tare', gloss: 0.6, rough: 1, specks: { n: 420, color: [24, 14, 8], size: [0.5, 1.3] } },
  ichimi: { ramp: 'tare', gloss: 0.6, rough: 1, flakes: { n: 160, colors: ['#D8321A', '#F05A22', '#B01E10', '#E8441C'] } },
  garlic: { ramp: 'tare', gloss: 0.75, rough: 1, garlic: 26 },
  kankara: { ramp: 'kankara', gloss: 1, rough: 0.8, garlic: 16, flakes: { n: 70, colors: ['#7E0C04', '#A8180A'] } },
  shio: { ramp: 'shio', gloss: 0.2, rough: 1.15, salt: 180 },
  ponzu: { ramp: 'ponzu', gloss: 1.25, rough: 0.95, wet: true },
  mune: { ramp: 'mune', gloss: 0.25, rough: 1.1, salt: 40, shape: 'slab' },
  tebasaki: { ramp: 'tare', gloss: 0.7, rough: 0.7, shape: 'wing', specks: { n: 160, color: [24, 14, 8], size: [0.4, 1.1] } },
  nankotsu: { ramp: 'base', gloss: 0.35, rough: 1, shape: 'small' },
  kushi: { ramp: 'tare', gloss: 0.7, rough: 0.9, shape: 'small' },
};

const LIGHT = (() => { const v = [-0.55, -0.7, 0.75]; const l = Math.hypot(...v); return v.map((x) => x / l); })();
const HALF = (() => { const v = [LIGHT[0], LIGHT[1], LIGHT[2] + 1]; const l = Math.hypot(...v); return v.map((x) => x / l); })();

// 1個を描いたキャンバスを返す（中心=キャンバス中央、半径R px）。
export function bakePiece({ R = 120, seed = 1, glaze = 'tare' } = {}) {
  const g = GLAZES[glaze] || GLAZES.tare;
  const rand = rng(seed * 7919 + 17);
  const noise = makeNoise(seed * 31 + 7);
  const noise2 = makeNoise(seed * 53 + 3);
  const noise3 = makeNoise(seed * 97 + 5);
  const lut = lutFor(g.ramp);

  // 形: 球をいくつか滑らかに結合
  let sx = 1, sy = 1;
  const lumps = [];
  if (g.shape === 'wing') {
    sx = 1; sy = 1;
    // 手羽先: 太い側と細い側をつないだ形
    lumps.push([-0.35, 0, 0.5, 0], [0.05, -0.04, 0.44, 0], [0.45, -0.08, 0.33, 0], [0.78, -0.12, 0.22, 0]);
  } else if (g.shape === 'slab') {
    sx = 1.18; sy = 0.86;
    lumps.push([0, 0, 0.72, 0]);
    for (let i = 0; i < 4; i++) { const a = rand() * TAU; lumps.push([Math.cos(a) * 0.32, Math.sin(a) * 0.26, 0.42 + rand() * 0.12, -0.05]); }
  } else {
    sx = 1 + rand() * 0.18; sy = 0.86 + rand() * 0.1;
    lumps.push([0, 0, 0.66, 0]);
    const n = 6 + ((rand() * 4) | 0);
    for (let i = 0; i < n; i++) {
      const a = rand() * TAU, d = 0.25 + rand() * 0.38;
      lumps.push([Math.cos(a) * d, Math.sin(a) * d, 0.26 + rand() * 0.24, (rand() - 0.6) * 0.15]);
    }
  }

  const pad = 1.32;
  const size = Math.ceil(R * 2 * pad * (g.shape === 'wing' ? 1.25 : 1));
  const W = size, H = Math.ceil(size * (g.shape === 'wing' ? 0.72 : 1));
  const cx = W / 2, cy = H / 2;
  const hmap = new Float32Array(W * H);
  const macro = new Float32Array(W * H);
  const fry = new Float32Array(W * H);
  const crustMap = new Float32Array(W * H);
  const rough = g.rough;
  const k = 14; // soft-max sharpness

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = (x - cx) / R / sx, v = (y - cy) / R / sy;
      // 輪郭にゆらぎ
      const wob = noise(u * 2.2 + 11, v * 2.2 + 5) * 0.07 + noise(u * 5 + 3, v * 5 + 9) * 0.03;
      let acc = 0, any = false;
      for (let i = 0; i < lumps.length; i++) {
        const L = lumps[i];
        const dx = u - L[0], dy = v - L[1];
        const rr = L[2] + wob;
        const d2 = rr * rr - dx * dx - dy * dy;
        if (d2 > -0.02) {
          const h = Math.sqrt(Math.max(0, d2)) * 0.82 + L[3] - (d2 < 0 ? 0.3 : 0);
          acc += Math.exp(k * h);
          any = true;
        }
      }
      const idx = y * W + x;
      if (!any) { hmap[idx] = -1; continue; }
      let h = Math.log(acc) / k;
      macro[idx] = h;
      // 揚げムラ（場所によって色の濃さが違う）
      fry[idx] = noise2(u * 2.4 + 21, v * 2.4 + 13) * 0.6 + noise3(u * 5 + 2, v * 5 + 8) * 0.25;
      // 衣: billow ノイズ（|n|）で小さな衣の粒が寄り集まった凸凹を作る
      const b1 = Math.abs(noise(u * 7 + 1.3, v * 7 + 7.1));
      const b2 = Math.abs(noise3(u * 15 + 4.2, v * 15 + 2.6));
      const b3 = Math.abs(noise2(u * 31 + 9.1, v * 31 + 1.7));
      const lump = noise2(u * 3.2 + 5.5, v * 3.2 + 3.3);
      const crust = b1 * 0.06 + b2 * 0.034 + b3 * 0.016 + lump * 0.03;
      h += crust * rough;
      hmap[idx] = h;
      crustMap[idx] = b1 * 0.9 + b2 * 0.6 + b3 * 0.3;
    }
  }

  const cv = typeof document === 'undefined' ? new OffscreenCanvas(W, H) : document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(W, H);
  const D = img.data;
  const glints = [];
  const scale = R * 0.9;
  const lumpsTop = new Float32Array(W * H);

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const h = hmap[i];
      if (h <= -1) continue;
      const hl = hmap[i - 1] <= -1 ? h - 0.05 : hmap[i - 1];
      const hr = hmap[i + 1] <= -1 ? h - 0.05 : hmap[i + 1];
      const hu = hmap[i - W] <= -1 ? h - 0.05 : hmap[i - W];
      const hd = hmap[i + W] <= -1 ? h - 0.05 : hmap[i + W];
      let nx = (hl - hr) * scale, ny = (hu - hd) * scale, nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl; ny /= nl; nz /= nl;
      const microDiff = clamp(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      // 塊全体の丸み（衣を除いた形）の陰影
      const ml = macro[i - 1] || macro[i], mr = macro[i + 1] || macro[i], mu = macro[i - W] || macro[i], md = macro[i + W] || macro[i];
      let mx = (ml - mr) * scale * 1.15, my = (mu - md) * scale * 1.15, mz = 1;
      const mlen = Math.hypot(mx, my, mz);
      const macroDiff = clamp((mx * LIGHT[0] + my * LIGHT[1] + mz * LIGHT[2]) / mlen);
      const diff = macroDiff * 0.55 + microDiff * 0.45;
      const spec = Math.pow(clamp(nx * HALF[0] + ny * HALF[1] + nz * HALF[2]), 70);
      const crust = crustMap[i];
      // 外周はしっかり揚がって濃く、上面は明るく
      const edge = smooth(0.0, 0.35, h);
      // crust が小さい所＝衣の谷。暗く落とす
      let t = 0.06 + diff * 0.8 + edge * 0.1 + (crust - 0.45) * 0.36 + fry[i] * 0.16;
      t = clamp(t * (0.7 + 0.3 * edge));
      const li = (t * 255) | 0;
      let r = lut[li * 3], gg = lut[li * 3 + 1], b = lut[li * 3 + 2];
      // 照り
      const s = spec * g.gloss * clamp(crust * 1.4) * 0.9;
      r += s * 255; gg += s * 244; b += s * 225;
      // 衣の山は乾いて明るい黄金色に
      if (crust > 0.7 && diff > 0.5) { const f = Math.min(1, (crust - 0.7) * 1.6); r += 34 * f; gg += 30 * f; b += 12 * f; }
      // アルファ（輪郭のアンチエイリアス）
      const a = smooth(-0.02, 0.03, h);
      D[i * 4] = r; D[i * 4 + 1] = gg; D[i * 4 + 2] = b; D[i * 4 + 3] = a * 255;
      lumpsTop[i] = diff;
      if (s > 0.55 && ((x * 7 + y * 13) % 97) === 0) glints.push([x - cx, y - cy, 3 + s * 4]);
    }
  }
  ctx.putImageData(img, 0, 0);

  // トッピング（表面の上にだけ）
  const onSurface = (x, y) => { const xi = x | 0, yi = y | 0; return xi > 0 && yi > 0 && xi < W && yi < H && hmap[yi * W + xi] > 0.08; };
  const pick = (tries = 30) => { for (let t = 0; t < tries; t++) { const x = rand() * W, y = rand() * H; if (onSurface(x, y)) return [x, y]; } return null; };
  const unit = R / 120;

  if (g.salt) {
    for (let i = 0; i < g.salt; i++) {
      const p = pick(); if (!p) continue;
      const s = (0.35 + rand() * 0.8) * unit;
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(rand() * TAU);
      ctx.fillStyle = 'rgba(90,50,20,0.35)'; ctx.fillRect(-s + 0.6, -s + 0.8, s * 2, s * 2);
      ctx.fillStyle = `rgba(255,255,250,${0.75 + rand() * 0.25})`; ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.restore();
    }
  }
  if (g.specks) {
    const { n, color, size } = g.specks;
    for (let i = 0; i < n; i++) {
      const p = pick(); if (!p) continue;
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${0.6 + rand() * 0.4})`;
      ctx.beginPath(); ctx.arc(p[0], p[1], (size[0] + rand() * (size[1] - size[0])) * unit, 0, TAU); ctx.fill();
    }
  }
  if (g.flakes) {
    const { n, colors } = g.flakes;
    for (let i = 0; i < n; i++) {
      const p = pick(); if (!p) continue;
      const s = (1 + rand() * 2.4) * unit;
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(rand() * TAU);
      ctx.fillStyle = colors[(rand() * colors.length) | 0];
      ctx.beginPath(); ctx.moveTo(-s, -s * 0.4); ctx.lineTo(s * 0.9, -s * 0.7); ctx.lineTo(s * 0.6, s * 0.6); ctx.lineTo(-s * 0.7, s * 0.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  if (g.garlic) {
    for (let i = 0; i < g.garlic; i++) {
      const p = pick(); if (!p) continue;
      const s = (1.6 + rand() * 2.4) * unit;
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(rand() * TAU);
      ctx.fillStyle = 'rgba(50,20,3,0.5)';
      ctx.beginPath(); ctx.ellipse(s * 0.3, s * 0.35, s, s * 0.7, 0, 0, TAU); ctx.fill();
      const gr = ctx.createLinearGradient(-s, -s, s, s);
      gr.addColorStop(0, '#FFF5D8'); gr.addColorStop(0.6, '#F0CF8E'); gr.addColorStop(1, '#C9934A');
      ctx.fillStyle = gr;
      ctx.beginPath();
      for (let j = 0; j < 7; j++) { const t = (j / 7) * TAU, m = s * (0.6 + rand() * 0.45); const px = Math.cos(t) * m, py = Math.sin(t) * m * 0.72; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  if (g.wet) {
    // ポン酢のつや: 細長いハイライト
    for (let i = 0; i < 70; i++) {
      const p = pick(); if (!p) continue;
      const xi = p[0] | 0, yi = p[1] | 0;
      if (lumpsTop[yi * W + xi] < 0.7) continue;
      ctx.fillStyle = `rgba(255,252,236,${0.35 + rand() * 0.4})`;
      ctx.beginPath(); ctx.ellipse(p[0], p[1], (1.5 + rand() * 3.5) * unit, (0.7 + rand() * 1.2) * unit, -0.6, 0, TAU); ctx.fill();
    }
  }
  return { canvas: cv, glints, w: W, h: H };
}

// 配置: [x, y, 半径, シード]（キャンバス短辺に対する比率）
const LAYOUTS = {
  hero: [[-0.3, -0.17, 0.25, 3], [0.17, -0.22, 0.25, 7], [0.36, 0.07, 0.22, 11], [-0.06, 0.03, 0.27, 5], [-0.38, 0.15, 0.22, 2], [0.1, 0.24, 0.25, 9]],
  trio: [[-0.2, -0.08, 0.24, 4], [0.21, -0.12, 0.23, 8], [0.01, 0.13, 0.26, 6]],
  single: [[0, 0, 0.34, 3]],
  nankotsu: [[-0.26, -0.16, 0.12, 1], [0.04, -0.2, 0.13, 2], [0.28, -0.07, 0.12, 3], [-0.12, 0.03, 0.13, 4], [0.16, 0.1, 0.12, 5], [-0.32, 0.17, 0.12, 6], [0.01, 0.24, 0.12, 7], [0.32, 0.2, 0.11, 8]],
  wings: [[-0.02, -0.12, 0.22, 3], [0.04, 0.13, 0.22, 9]],
};

const cache = new Map();

// 重い高さマップ計算は Web Worker（OffscreenCanvas）で行い、メインスレッドを止めない。
// Worker が使えない環境ではメインスレッドで計算する。
let worker = null, seq = 0;
const pending = new Map();
function getWorker() {
  if (worker !== null) return worker;
  worker = false;
  try {
    if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof document !== 'undefined') {
      worker = new Worker(new URL('./karaage-worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => { const { id, ...res } = e.data; pending.get(id)?.resolve(res); pending.delete(id); };
      worker.onerror = () => { worker = false; for (const [, p] of pending) p.fallback(); pending.clear(); };
    }
  } catch { worker = false; }
  return worker;
}

function bake(opts) {
  const key = `${opts.glaze}|${opts.seed}|${Math.round(opts.R)}`;
  if (cache.has(key)) return cache.get(key);
  const local = () => { const r = bakePiece(opts); return { canvas: r.canvas, glints: r.glints, w: r.w, h: r.h }; };
  const w = getWorker();
  const job = w
    ? new Promise((resolve) => {
        const id = ++seq;
        pending.set(id, { resolve: (r) => resolve({ canvas: r.bmp, glints: r.glints, w: r.w, h: r.h }), fallback: () => resolve(local()) });
        w.postMessage({ id, opts });
      })
    : new Promise((resolve) => setTimeout(() => resolve(local()), 0));
  cache.set(key, job);
  return job;
}

export async function renderPile(canvas, { glaze = 'tare', layout = 'trio', seed = 1, dpr, maxRes = 1.6 } = {}) {
  const ratio = Math.min(maxRes, dpr || window.devicePixelRatio || 1);
  const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
  const S = Math.min(w, h);
  const g = GLAZES[glaze] || GLAZES.tare;
  const ticket = (canvas._pileTicket = (canvas._pileTicket || 0) + 1);
  const begin = () => {
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return ctx;
  };

  if (glaze === 'kushi') {
    const len = S * 0.92;
    const parts = await Promise.all([0, 1, 2, 3].map((i) => bake({ R: S * 0.1 * ratio, seed: seed * 31 + i, glaze: 'kushi' })));
    if (ticket !== canvas._pileTicket) return { glints: [] };
    const ctx = begin();
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.38);
    drawShadow(ctx, 0, S * 0.06, len * 0.42, S * 0.07);
    const bamboo = ctx.createLinearGradient(0, -S * 0.012, 0, S * 0.012);
    bamboo.addColorStop(0, '#F4DFB2'); bamboo.addColorStop(1, '#A87F45');
    ctx.fillStyle = bamboo;
    ctx.fillRect(-len / 2, -S * 0.011, len, S * 0.022);
    parts.forEach((p, i) => ctx.drawImage(p.canvas, -len * 0.3 + i * len * 0.19 - p.w / ratio / 2, -p.h / ratio / 2, p.w / ratio, p.h / ratio));
    ctx.restore();
    return { glints: [] };
  }

  let items = LAYOUTS[layout] || LAYOUTS.trio;
  if (g.shape === 'small') items = LAYOUTS.nankotsu;
  if (g.shape === 'wing') items = LAYOUTS.wings;
  const order = [...items].sort((a, b) => a[1] - b[1]);
  const parts = await Promise.all(order.map(([, , pr, ps]) => bake({ R: pr * S * ratio, seed: seed * 101 + ps, glaze })));
  if (ticket !== canvas._pileTicket) return { glints: [] };
  const ctx = begin();
  const allGlints = [];
  for (const [px, py, pr] of order) {
    const cx = w / 2 + px * S, cy = h / 2 + py * S, R = pr * S;
    drawShadow(ctx, cx + R * 0.08, cy + R * 0.72, R * 1.05, R * 0.38);
  }
  order.forEach(([px, py], i) => {
    const p = parts[i];
    const cx = w / 2 + px * S, cy = h / 2 + py * S;
    const dw = p.w / ratio, dh = p.h / ratio;
    ctx.drawImage(p.canvas, cx - dw / 2, cy - dh / 2, dw, dh);
    for (const [x, y, s] of p.glints.slice(0, 5)) allGlints.push([cx + x / ratio, cy + y / ratio, s / ratio]);
  });
  return { glints: allGlints };
}

function drawShadow(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(40,14,0,0.38)');
  g.addColorStop(0.5, 'rgba(40,14,0,0.16)');
  g.addColorStop(1, 'rgba(40,14,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
  ctx.restore();
}

// 湯気・きらめき・油はねを重ねるアニメーション層。
export class Sizzle {
  constructor(canvas, { source, density = 1, steamFrom = [0.3, 0.7, 0.4], offsetY = 0 } = {}) {
    this.offsetY = offsetY;
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.source = source;
    this.density = density;
    this.steamFrom = steamFrom;
    this.p = [];
    this.sparks = [];
    this.t = 0;
    this.running = false;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
  }
  resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.c.clientWidth; this.h = this.c.clientHeight;
    this.c.width = Math.round(this.w * ratio); this.c.height = Math.round(this.h * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  burst(x, y, n = 28) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
      const v = 2.5 + Math.random() * 6.5;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, s: 1 + Math.random() * 2.4 });
    }
    if (this.reduce) return;
    if (!this.running) this.start();
  }
  start() {
    if (this.reduce || this.running) return;
    this.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(50, now - last) / 16.67;
      last = now;
      this.step(dt);
      this.draw(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  step(dt) {
    this.t += dt;
    const { w, h } = this;
    const [x0, x1, y0] = this.steamFrom;
    if (Math.random() < 0.2 * this.density * dt) {
      this.p.push({ x: w * (x0 + Math.random() * (x1 - x0)), y: h * y0, r: 12 + Math.random() * 20, life: 1, sway: Math.random() * TAU, v: 0.35 + Math.random() * 0.5 });
    }
    for (const q of this.p) {
      q.y -= q.v * dt;
      q.x += Math.sin(this.t * 0.03 + q.sway) * 0.35 * dt;
      q.r += 0.24 * dt;
      q.life -= 0.0045 * dt;
    }
    this.p = this.p.filter((q) => q.life > 0 && q.y > -80);
    for (const s of this.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 0.3 * dt; s.life -= 0.024 * dt; }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  }
  draw(now) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    for (const q of this.p) {
      const a = Math.sin(q.life * Math.PI) * 0.12;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
      g.addColorStop(0, `rgba(255,252,244,${a})`);
      g.addColorStop(1, 'rgba(255,252,244,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
    }
    const glints = this.source?.glints || [];
    for (let i = 0; i < glints.length; i++) {
      const [x, y0, s] = glints[i];
      const y = y0 + this.offsetY;
      const tw = Math.max(0, Math.sin(now * 0.002 + i * 2.17)) ** 10;
      if (tw < 0.02) continue;
      const L = s * 2.4 * tw + 2;
      ctx.strokeStyle = `rgba(255,253,240,${0.9 * tw})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
    }
    for (const s of this.sparks) {
      ctx.fillStyle = `rgba(255,${(200 + 55 * s.life) | 0},${(130 * s.life) | 0},${s.life})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s * s.life + 0.4, 0, TAU); ctx.fill();
    }
  }
}
