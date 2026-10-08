import { site, shops, company, telHref } from './data.mjs';

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ページの深さに応じて相対リンクを作る。preview=true では Artifact 用に index.html まで書く。
export function linker(pagePath, { preview = false } = {}) {
  const depth = pagePath.split('/').filter(Boolean).length - (pagePath.endsWith('/') ? 0 : 1);
  const up = depth > 0 ? '../'.repeat(depth) : './';
  return (target) => {
    if (/^(https?:|mailto:|tel:|#)/.test(target)) return target;
    const [p, hash] = target.split('#');
    let path = p.replace(/^\//, '');
    if (preview && (path === '' || path.endsWith('/'))) path += 'index.html';
    const out = (up === './' ? (path || './') : up + path) || './';
    return hash !== undefined ? `${out}#${hash}` : out;
  };
}

const NAV = [
  ['menu/', 'メニュー'],
  ['/#kodawari', 'こだわり'],
  ['shop/', '店舗'],
  ['news/', 'お知らせ'],
  ['recruit/', '採用'],
  ['franchise/', 'FC加盟'],
];

export const ICON = {
  tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ne: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  bag: '<svg class="ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M10 16h28l-3 26H13z"/><path d="M17 16v-4a7 7 0 0 1 14 0v4"/></svg>',
  phone: '<svg class="ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="13" y="5" width="22" height="38" rx="4"/><path d="M21 37h6"/></svg>',
  bike: '<svg class="ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="11" cy="34" r="7"/><circle cx="37" cy="34" r="7"/><path d="M11 34l8-14h10l8 14M19 20l-3-6h-4M29 20l4-8h5"/></svg>',
};

// ロゴマーク: 揚げ色の丸にからあげのシルエット
export const MARK = `<svg class="logo__mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#F2A900" stroke="#1C0F08" stroke-width="2"/><path fill="#1C0F08" d="M18 36c-3-6 1-13 7-14 2-5 9-7 13-3 6-1 11 4 9 10 4 4 1 11-5 11-3 4-10 5-14 2-6 1-11-1-10-6z"/><circle cx="27" cy="29" r="2.2" fill="#F2A900"/><circle cx="37" cy="27" r="1.6" fill="#F2A900"/><circle cx="34" cy="37" r="1.9" fill="#F2A900"/></svg>`;

export function head({ title, description, path, ogType = 'website', jsonld, L, noindex = false, preload = [] }) {
  const url = site.url + (path === '/' ? '/' : '/' + path.replace(/^\//, ''));
  const og = site.url + site.ogImage;
  return `<!doctype html>
<html lang="ja" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="${site.themeColor}">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="からあげ専門店 鶏好">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="からあげ専門店 鶏好 — 幸福 × 笑顔 × 愛 = 鶏好のからあげ">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${L('assets/img/favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${L('assets/img/apple-touch-icon.png')}">
<link rel="manifest" href="${L('manifest.webmanifest')}">
<link rel="alternate" type="text/plain" href="${L('llms.txt')}" title="llms.txt">
<link rel="preload" href="${L('assets/css/fonts.css')}" as="style">
<link rel="stylesheet" href="${L('assets/css/fonts.css')}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${L('assets/css/fonts.css')}"></noscript>
<style>${globalThis.__MAIN_CSS__ || ''}</style>
<link rel="modulepreload" href="${L('assets/js/karaage.js')}">
${preload.join('\n')}
<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#main">本文へスキップ</a>`;
}

export function header({ L, current = '', onGold = true }) {
  const items = NAV.map(([href, label]) => {
    const cur = current && href.startsWith(current) ? ' aria-current="page"' : '';
    return `<li><a href="${L(href)}"${cur}>${label}</a></li>`;
  }).join('');
  const drawerItems = [['/', 'ホーム'], ...NAV, ['contact/', 'お問い合わせ']].map(([h, l]) => `<li><a href="${L(h)}">${l}</a></li>`).join('');
  const tels = shops.map((s) => `<a href="${telHref(s.tel)}"><span>${esc(s.name)}</span><span class="mono">${s.tel}</span></a>`).join('');
  return `<header class="hdr${onGold ? ' hdr--onGold' : ''}">
  <div class="wrap hdr__in">
    <a class="logo" href="${L('/')}">${MARK}<span class="logo__txt"><span class="logo__name">鶏好</span><span class="logo__sub">からあげ専門店</span></span><span class="sr-only">（ホーム）</span></a>
    <nav class="nav" aria-label="メインメニュー">
      <ul class="nav__list">${items}</ul>
      <a class="btn nav__tel" href="${L('shop/')}">${ICON.tel}電話で注文</a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="メニューを開く"><span></span></button>
    </nav>
  </div>
</header>
<div class="drawer" id="drawer" hidden>
  <button class="burger close" type="button" aria-expanded="true" aria-label="メニューを閉じる"><span></span></button>
  <nav aria-label="モバイルメニュー"><ul>${drawerItems}</ul></nav>
  <div class="drawer__tels"><p class="eyebrow" style="color:inherit">電話でご予約</p>${tels}</div>
</div>`;
}

export function footer({ L }) {
  return `<footer class="ftr">
  <div class="wrap">
    <p class="ftr__love" aria-hidden="true">I Love とりよし！</p>
    <div class="ftr__grid">
      <div>
        <h2>運営会社</h2>
        <p><a href="${L('corporation/')}">${esc(company.name)}</a></p>
        <address>〒${company.postalCode} ${company.region}${company.locality}${company.street}<br>FAX ${company.fax}</address>
      </div>
      <div>
        <h2>店舗</h2>
        <ul>${shops.map((s) => `<li><a href="${L(`shop/${s.slug}/`)}">${esc(s.name)}</a> <span class="mono" style="opacity:.7">${s.tel}</span></li>`).join('')}</ul>
      </div>
      <div>
        <h2>サイト</h2>
        <ul>
          <li><a href="${L('menu/')}">メニュー</a></li>
          <li><a href="${L('allergies/')}">アレルギー表示</a></li>
          <li><a href="${L('news/')}">お知らせ</a></li>
          <li><a href="${L('recruit/')}">採用情報</a></li>
          <li><a href="${L('franchise/')}">フランチャイズ情報</a></li>
          <li><a href="${L('contact/')}">お問い合わせ</a></li>
          <li><a href="${L('privacy-policy/')}">プライバシーポリシー</a></li>
          <li><a href="${L('sitemap/')}">サイトマップ</a></li>
        </ul>
      </div>
    </div>
    <div class="ftr__base"><span>© ${site.since}–${new Date().getFullYear()} ${esc(company.name)} / からあげ専門店 鶏好</span><span>福岡のからあげテイクアウト専門店</span></div>
  </div>
</footer>
<script type="module" src="${L('assets/js/main.js')}"></script>
</body>
</html>`;
}

export function pageHero({ L, title, lead, crumbs }) {
  const list = [['/', 'ホーム'], ...crumbs];
  return `<section class="phero">
  <div class="wrap phero__in">
    <nav class="crumbs" aria-label="パンくずリスト"><ol>${list
      .map(([h, l], i) => (i === list.length - 1 ? `<li aria-current="page">${esc(l)}</li>` : `<li><a href="${L(h)}">${esc(l)}</a></li>`))
      .join('')}</ol></nav>
    <h1>${title}</h1>
    ${lead ? `<p>${lead}</p>` : ''}
  </div>
</section>`;
}
