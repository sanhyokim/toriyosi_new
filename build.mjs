// 静的サイトジェネレーター（依存なし）。
//   node build.mjs            → dist/ に本番用を出力
//   node build.mjs --preview  → preview/ に Artifact プレビュー用を出力（リンクを index.html 付きに）
import { mkdir, writeFile, readFile, cp, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { site, company, shops, flavors, menu, menuNotes, news, steps, faqs, recruit, franchiseSteps, addressOf, telHref, telIntl, mapUrl } from './src/data.mjs';
import { esc, linker, head, header, footer, pageHero, ICON } from './src/layout.mjs';

const PREVIEW = process.argv.includes('--preview');
const OUT = PREVIEW ? 'preview' : 'dist';
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const photoExists = (f) => f && existsSync(join('src/assets/photos', f));

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;
const shopId = (s) => `${site.url}/shop/${s.slug}/#restaurant`;
const abs = (p) => `${site.url}/${p.replace(/^\//, '')}`;

const pages = [];
const page = (path, render) => pages.push({ path, render });

/* ---------- 構造化データ ---------- */
const orgLD = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: company.name,
  alternateName: ['からあげ専門店 鶏好', '鶏好', 'とりよし', 'Toriyoshi'],
  url: site.url,
  logo: abs('assets/img/logo.png'),
  email: company.email,
  faxNumber: company.fax,
  address: { '@type': 'PostalAddress', postalCode: company.postalCode, addressRegion: company.region, addressLocality: company.locality, streetAddress: company.street, addressCountry: 'JP' },
  brand: { '@type': 'Brand', name: '鶏好', alternateName: ['からあげ鶏好', 'とりよし'], slogan: site.tagline },
  subOrganization: shops.map((s) => ({ '@id': shopId(s) })),
});
const websiteLD = () => ({ '@type': 'WebSite', '@id': SITE_ID, url: site.url, name: 'からあげ専門店 鶏好', inLanguage: 'ja', publisher: { '@id': ORG_ID } });
const restaurantLD = (s) => ({
  '@type': ['Restaurant', 'LocalBusiness'],
  '@id': shopId(s),
  name: `からあげ専門店 鶏好 ${s.name}`,
  alternateName: `とりよし ${s.short}`,
  url: abs(`shop/${s.slug}/`),
  telephone: telIntl(s.tel),
  image: photoExists(s.photo) ? abs(`assets/photos/${s.photo}`) : !PREVIEW && s.legacyPhoto ? s.legacyPhoto : abs(site.ogImage),
  servesCuisine: ['唐揚げ', '鶏料理', 'Japanese fried chicken (karaage)'],
  address: { '@type': 'PostalAddress', postalCode: s.postalCode, addressRegion: s.region, addressLocality: s.locality, streetAddress: s.street, addressCountry: 'JP' },
  geo: { '@type': 'GeoCoordinates', latitude: s.geo.lat, longitude: s.geo.lng },
  hasMap: mapUrl(s),
  acceptsReservations: true,
  hasMenu: abs('menu/'),
  parentOrganization: { '@id': ORG_ID },
  ...(s.hours ? { openingHours: s.hours } : {}),
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'テイクアウト', value: true },
    { '@type': 'LocationFeatureSpecification', name: '電話予約', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'デリバリー', value: s.delivery.length > 0 },
  ],
  potentialAction: [
    { '@type': 'ReserveAction', target: { '@type': 'EntryPoint', urlTemplate: telHref(s.tel) }, result: { '@type': 'FoodEstablishmentReservation', name: 'テイクアウト予約' } },
    ...s.delivery.map((d) => ({ '@type': 'OrderAction', name: d.name, target: { '@type': 'EntryPoint', urlTemplate: d.url }, deliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet' })),
  ],
});
const menuLD = () => {
  const sections = [...new Set(menu.map((m) => m.section))];
  return {
    '@type': 'Menu',
    '@id': `${site.url}/menu/#menu`,
    name: '鶏好 メニュー',
    inLanguage: 'ja',
    hasMenuSection: sections.map((sec) => ({
      '@type': 'MenuSection',
      name: sec,
      hasMenuItem: menu.filter((m) => m.section === sec).map((m) => ({
        '@type': 'MenuItem',
        name: m.name,
        description: [m.spec, m.desc, m.options ? `選べる：${m.options.join('・')}` : ''].filter(Boolean).join(' / '),
        ...(m.price ? { offers: { '@type': 'Offer', price: m.price, priceCurrency: 'JPY' } } : {}),
      })),
    })),
  };
};
const crumbLD = (list) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['/', 'ホーム'], ...list].map(([p, n], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(p === '/' ? '' : p) })),
});
const webpageLD = (path, name, type = 'WebPage', extra = {}) => ({
  '@type': type, '@id': `${abs(path)}#webpage`, url: abs(path), name, inLanguage: 'ja', isPartOf: { '@id': SITE_ID }, about: { '@id': ORG_ID }, dateModified: BUILD_DATE, ...extra,
});
const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': [orgLD(), websiteLD(), ...nodes] });

/* ---------- 部品 ---------- */
// 本番では、今のサーバーに残る WordPress の写真（/wp-content/uploads/…）を同じURLで使う。
// 写真が見つからなければ main.js が img を外し、下の手続き生成イラストが見える。
const LEGACY_PHOTOS = !PREVIEW && !process.argv.includes('--no-legacy-photos');
const photoSrc = (L, photo, legacy) => photoExists(photo) ? L(`assets/photos/${photo}`) : LEGACY_PHOTOS && legacy ? new URL(legacy).pathname : '';
const visual = (L, { photo, legacy, glaze, layout = 'trio', seed = 1, alt }) => {
  const src = photoSrc(L, photo, legacy);
  const img = src
    ? `<img src="${src}" alt="${esc(alt)}" loading="lazy" decoding="async" width="800" height="600" data-fallback>`
    : '';
  return `<canvas data-glaze="${glaze}" data-layout="${layout}" data-seed="${seed}" role="img" aria-label="${esc(alt)}のイメージ"></canvas>${img}`;
};

const menuCard = (L, m, i) => `<article class="item rv" id="${m.id}">
  <div class="item__vis">${m.reservation ? '<span class="badge">要予約</span>' : ''}${visual(L, { photo: m.photo, legacy: m.legacyPhoto, glaze: m.glaze, seed: i + 3, alt: m.name })}</div>
  <div class="item__body">
    <h3>${esc(m.name)}</h3>
    ${m.spec ? `<p class="item__spec">${esc(m.spec)}</p>` : ''}
    <p>${esc(m.desc)}</p>
    ${m.options ? `<ul class="chips" aria-label="選べる種類">${m.options.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
  </div>
</article>`;

const ticket = (L, s, { heading = 'h3' } = {}) => `<article class="ticket rv" data-shop="${s.slug}">
  <div class="ticket__main">
    <${heading}><a href="${L(`shop/${s.slug}/`)}" style="text-decoration:none">${esc(s.name)}</a>${s.flagship ? '<span class="flag">本店</span>' : ''}</${heading}>
    <address>${esc(addressOf(s))}</address>
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
    ${s.delivery.length ? `<div class="dl" aria-label="宅配">${s.delivery.map((d) => `<a href="${d.url}" target="_blank" rel="noopener">${esc(d.name)}</a>`).join('')}</div>` : ''}
    <p class="links"><a href="${mapUrl(s)}" target="_blank" rel="noopener">地図アプリで開く</a><a href="${L(`shop/${s.slug}/`)}">店舗ページ</a></p>
  </div>
  <div class="ticket__stub">
    <span class="stub-l">TEL ご予約</span>
    <a class="tel" href="${telHref(s.tel)}">${s.tel}</a>
    <button class="copy" type="button" data-copy="${s.tel}">コピー</button>
  </div>
</article>`;

// 店舗位置を緯度経度から正しい縮尺で描く地図
function shopMap() {
  const W = 400, H = 600;
  const lat0 = 33.575, lat1 = 33.79, lng0 = 130.36;
  const ky = H / (lat1 - lat0);
  const kx = ky * Math.cos((33.68 * Math.PI) / 180);
  const P = (lat, lng) => [(lng - lng0) * kx, (lat1 - lat) * ky];
  const kmPx = ky / 110.9;
  const grid = [];
  for (let la = 33.6; la < lat1; la += 0.05) { const y = P(la, 0)[1]; grid.push(`<line x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="4" y="${(y - 4).toFixed(1)}">${la.toFixed(2)}°N</text>`); }
  for (let ln = 130.4; ln < 130.53; ln += 0.05) { const x = P(0, ln)[0]; grid.push(`<line y1="0" y2="${H}" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}"/><text x="${(x + 4).toFixed(1)}" y="${H - 6}">${ln.toFixed(2)}°E</text>`); }
  const pins = shops.map((s) => {
    const [x, y] = P(s.geo.lat, s.geo.lng);
    const right = x < W * 0.62;
    return `<g class="pin" id="pin-${s.slug}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8"/><text x="${(x + (right ? 14 : -14)).toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="${right ? 'start' : 'end'}">${s.name}</text></g>`;
  }).join('');
  const [hx, hy] = P(33.5897, 130.4207);
  const bar = kmPx * 2;
  return `<figure class="map rv" aria-labelledby="map-cap">
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="鶏好4店舗の位置関係（福岡市東区・福津市）">
    <g class="grid">${grid.join('')}</g>
    <g class="ref"><circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="4"/><text x="${(hx + 10).toFixed(1)}" y="${(hy + 4).toFixed(1)}">博多駅</text></g>
    ${pins}
    <g transform="translate(${W - 24 - bar} ${H - 34})" class="ref"><rect width="${bar.toFixed(1)}" height="4" fill="currentColor" style="fill:var(--kraft-ink)"/><text y="-6">2 km</text></g>
    <g transform="translate(${W - 30} 30)" class="ref"><path d="M0 -16 L7 6 L0 1 L-7 6 Z" style="fill:var(--kraft-ink)"/><text x="-4" y="22">N</text></g>
  </svg>
  <figcaption id="map-cap">緯度・経度から縮尺どおりに配置しています。</figcaption>
</figure>`;
}

/* ---------- トップ ---------- */
page('/', (L) => {
  const latest = news[0];
  const flv = flavors.map((f) => f.name);
  const marquee = [...flv, 'むね肉', '手羽先', '身付き軟骨', '盛り合わせ'];
  const mq = `<div class="marquee__group" aria-hidden="true">${marquee.map((m) => `<span>${esc(m)}</span><i></i>`).join('')}</div>`;
  return head({
    title: 'からあげ専門店 鶏好（とりよし）｜福岡のからあげテイクアウト',
    description: site.description,
    path: '/',
    L,
    jsonld: graph(webpageLD('/', 'からあげ専門店 鶏好', 'WebPage', { primaryImageOfPage: abs(site.ogImage) }), ...shops.map(restaurantLD), menuLD(), {
      '@type': 'FAQPage', '@id': `${site.url}/#faq`, mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }),
  }) + header({ L }) + `
<main id="main">
  <section class="hero" aria-labelledby="hero-title">
    <div class="wrap hero__grid">
      <p class="hero__kicker"><span class="status" role="status"><i></i>揚げたて準備中</span><span>福岡市東区・福津市に4店舗</span></p>
      <div class="hero__stage">
        <h1 class="hero__name" id="hero-title"><span class="sub">福岡のからあげテイクアウト専門店</span>鶏好<span class="ruby">TORIYOSHI</span></h1>
        <div class="hero__pile" tabindex="0" role="img" aria-label="揚げたての鶏好のからあげ。タップすると揚げ音が弾けます">
          <span class="loading" aria-hidden="true">揚げたて準備中…</span>
          <canvas class="base"></canvas><canvas class="fx"></canvas>
        </div>
      </div>
      <p class="hero__tate" aria-label="食卓に幸福を、食卓に笑顔を、食卓に愛を">食卓に<span class="flip" data-words='${JSON.stringify(site.taglineWords)}'><span>${site.taglineWords[0]}</span></span>を</p>
      <div class="hero__foot">
        <p class="equation"><b>幸福</b><span class="op">×</span><b>笑顔</b><span class="op">×</span><b>愛</b><span class="op">=</span><span>鶏好のからあげ</span></p>
        <div class="hero__cta"><a class="btn" href="#shops">${ICON.tel}電話で予約する</a><a class="btn btn--ghost" href="#menu">メニューを見る</a></div>
      </div>
    </div>
    <p class="hero__hint" aria-hidden="true">TAP THE KARAAGE ↓</p>
  </section>

  <div class="marquee" role="presentation"><div class="marquee__track">${mq}${mq}</div></div>

  <aside class="newsbar" aria-label="最新のお知らせ"><div class="wrap newsbar__in"><span class="tag">NEWS</span><time datetime="${latest.date}">${latest.date.replace(/-/g, '.')}</time><a href="${L(`news/${latest.slug}/`)}">${esc(latest.title)}</a><a href="${L('news/')}" style="margin-left:auto;font-weight:400">お知らせ一覧 →</a></div></aside>

  <section class="sec" id="kodawari" aria-labelledby="k-title">
    <div class="wrap steps">
      <div class="steps__lead rv">
        <p class="eyebrow">こだわり</p>
        <h2 class="h2" id="k-title">長時間熟成させた、<br>自慢の唐揚げ。</h2>
        <p class="lead">特製の漬けダレでじっくり漬け込んだからあげは、そのままでもおいしい。オリジナルの塩を添えれば、もっとおいしい。味に自信があります。</p>
      </div>
      <ol class="steps__list">${steps.map((s) => `<li class="step rv"><span class="step__n" aria-hidden="true">${s.n}</span><h3>${s.title}<small>${s.en}</small></h3><p>${s.text}</p></li>`).join('')}</ol>
    </div>
  </section>

  <section class="sec lab" id="flavors" aria-labelledby="f-title">
    <div class="wrap">
      <div class="sec__head rv"><p class="eyebrow">Flavor Lab</p><h2 class="h2" id="f-title">もも、7つの味。</h2><p class="lead">看板の骨なしもも肉は、7種類の味から選べます。気になる味を押してみてください。</p></div>
      <div class="lab__grid">
        <div class="lab__stage rv"><span class="lab__count mono">01 / 07</span><canvas role="img" aria-label="選んだ味のからあげのイメージ"></canvas><span class="lab__big" aria-hidden="true">${flavors[0].name}</span></div>
        <div>
          <ul class="flist" role="tablist" aria-label="もも肉の味" aria-orientation="vertical">${flavors.map((f, i) => `<li role="presentation"><button role="tab" type="button" id="tab-${f.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-glaze="${f.glaze}" data-name="${esc(f.name)}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="nm">${esc(f.name)}</span>${f.badge ? `<span class="bd">${f.badge}</span>` : '<span></span>'}<span class="cp">${esc(f.copy)}</span></button></li>`).join('')}</ul>
          <p class="lab__note">骨なしもも肉 6〜7個（250g以上）。オリジナルの塩は別売りです。</p>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="menu" aria-labelledby="m-title">
    <div class="wrap">
      <div class="sec__head rv"><p class="eyebrow">Menu</p><h2 class="h2" id="m-title">お一人様から大家族まで。</h2><p class="lead">一人で食べるお弁当から、みんなで囲む盛り合わせまで。誰でも楽しめる豊富なメニューです。</p></div>
      <div class="menu-grid">${menu.map((m, i) => menuCard(L, m, i)).join('')}</div>
      <ul class="notes">${menuNotes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      <p style="margin-top:28px"><a class="btn btn--ghost" href="${L('menu/')}">メニューとアレルギー表示を見る ${ICON.arrow}</a></p>
    </div>
  </section>

  <section class="sec" id="order" aria-labelledby="o-title" style="padding-top:0">
    <div class="wrap">
      <div class="sec__head rv"><p class="eyebrow">How to order</p><h2 class="h2" id="o-title">電話1本で、揚げたてを。</h2><p class="lead">ご自宅のおかずの一品にも。受け取りの時間に合わせてご用意します。</p></div>
      <div class="order rv">
        <div>${ICON.phone}<h3>電話で予約</h3><p>お近くの店舗にお電話ください。受け取り時間に合わせて揚げたてをご用意します。盛り合わせはご予約制です。</p></div>
        <div>${ICON.bag}<h3>店頭で</h3><p>お店で直接ご注文いただけます。揚げ上がりまで少しお待ちいただく場合があります。</p></div>
        <div>${ICON.bike}<h3>宅配で</h3><p>吉塚店は Uber Eats・Wolt・出前館、福津店は Uber Eats でお届けします。</p></div>
      </div>
    </div>
  </section>

  <section class="sec on-kraft" id="shops" aria-labelledby="s-title">
    <div class="wrap">
      <div class="sec__head rv"><p class="eyebrow">Shops</p><h2 class="h2" id="s-title">お近くの鶏好へ。</h2><p class="lead" style="color:var(--kraft-ink)">福岡市東区に3店舗、福津市に1店舗。ご予約はお電話で。</p></div>
      <div class="shops">${shopMap()}<div class="tickets">${shops.map((s) => ticket(L, s)).join('')}</div></div>
    </div>
  </section>

  <section class="sec" id="faq" aria-labelledby="q-title">
    <div class="wrap">
      <div class="sec__head rv"><p class="eyebrow">FAQ</p><h2 class="h2" id="q-title">よくあるご質問</h2></div>
      <div class="faq">${faqs.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><p class="ans">${esc(f.a)}</p></details>`).join('')}</div>
    </div>
  </section>

  <section class="sec" aria-label="採用とフランチャイズ" style="padding-top:0">
    <div class="wrap duo">
      <a href="${L('recruit/')}" class="rv"><span class="arrow">${ICON.ne}</span><p class="eyebrow" style="color:inherit;opacity:.7">Recruit</p><h3>一緒に、<br>揚げませんか。</h3><p>正社員（店長候補）を募集しています。未経験から店長、本部マネージャーへ。</p></a>
      <a href="${L('franchise/')}" class="rv"><span class="arrow">${ICON.ne}</span><p class="eyebrow" style="color:inherit;opacity:.7">Franchise</p><h3>あなたの街に、<br>鶏好を。</h3><p>直営店で培ったノウハウで、物件探しから開業後までサポートします。</p></a>
    </div>
  </section>
</main>` + footer({ L });
});

/* ---------- メニュー ---------- */
page('menu/', (L) => head({
  title: 'メニュー｜からあげ専門店 鶏好（とりよし）',
  description: '鶏好のメニュー。骨なしもも肉（たれ・たれコショー・たれ一味・たれにんにく・韓辛にんにく・塩・ポン酢の7種）、むね肉、手羽先、身付き軟骨、串、からあげ弁当、盛り合わせ（3人前・5人前）。',
  path: 'menu/', L,
  jsonld: graph(webpageLD('menu/', 'メニュー', 'WebPage', { mainEntity: { '@id': `${site.url}/menu/#menu` } }), menuLD(), crumbLD([['menu/', 'メニュー']])),
}) + header({ L, current: 'menu/' }) + `
<main id="main">
${pageHero({ L, title: 'メニュー', lead: '特製の漬けダレで長時間熟成させた、鶏好の自慢のからあげ。お1人様から大家族まで楽しめるメニューです。', crumbs: [['menu/', 'メニュー']] })}
<section class="sec"><div class="wrap stack">
  <div>
    <div class="sec__head"><p class="eyebrow">骨なしもも肉の味</p><h2 class="h2">7種類から選べます</h2></div>
    <ul class="ftiles">${flavors.map((f, i) => `<li class="ftile"><canvas data-glaze="${f.glaze}" data-layout="trio" data-seed="${i + 2}" role="img" aria-label="${esc(f.name)}のからあげのイメージ"></canvas><div><h3>${esc(f.name)}${f.badge ? `<small>${f.badge}</small>` : ''}</h3><p>${esc(f.copy)}</p></div></li>`).join('')}</ul>
  </div>
  <div class="menu-grid">${menu.map((m, i) => menuCard(L, m, i)).join('')}</div>
  <ul class="notes">${menuNotes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
  <div class="callout"><strong>アレルギーについて</strong>原材料・アレルギー情報は<a href="${L('allergies/')}">アレルギー表示</a>のページをご覧ください。</div>
</div></section>
</main>` + footer({ L }));

/* ---------- アレルギー ---------- */
page('allergies/', (L) => head({
  title: 'アレルギー表示｜からあげ専門店 鶏好',
  description: '鶏好のからあげのアレルギー表示について。ご不明な点は各店舗へお問い合わせください。',
  path: 'allergies/', L,
  jsonld: graph(webpageLD('allergies/', 'アレルギー表示'), crumbLD([['menu/', 'メニュー'], ['allergies/', 'アレルギー表示']])),
}) + header({ L, current: 'menu/' }) + `
<main id="main">
${pageHero({ L, title: 'アレルギー表示', crumbs: [['menu/', 'メニュー'], ['allergies/', 'アレルギー表示']] })}
<section class="sec"><div class="wrap prose">
  <div class="callout"><strong>ご注文の前に店舗へご確認ください</strong>商品ごとの原材料・アレルギー物質は、各店舗でご案内しています。同じ調理場・同じ油で複数の商品を調理しているため、ご心配な方はご注文前にお電話でご相談ください。</div>
  <h2>店舗の連絡先</h2>
  <ul>${shops.map((s) => `<li>${esc(s.name)}：<a href="${telHref(s.tel)}" class="mono">${s.tel}</a></li>`).join('')}</ul>
</div></section>
</main>` + footer({ L }));

/* ---------- 店舗一覧・詳細 ---------- */
page('shop/', (L) => head({
  title: '店舗一覧｜からあげ専門店 鶏好（福岡市東区・福津市）',
  description: '鶏好の店舗一覧。美和台本店・吉塚店・舞松原店（福岡市東区）、福津店（福津市）。電話予約・Uber Eats・Wolt・出前館の宅配にも対応。',
  path: 'shop/', L,
  jsonld: graph(webpageLD('shop/', '店舗一覧', 'CollectionPage'), ...shops.map(restaurantLD), crumbLD([['shop/', '店舗一覧']])),
}) + header({ L, current: 'shop/' }) + `
<main id="main">
${pageHero({ L, title: '店舗一覧', lead: 'お近くのお店はこちらからお探しください。ご予約はお電話で承ります。', crumbs: [['shop/', '店舗一覧']] })}
<section class="sec"><div class="wrap shops">${shopMap()}<div class="tickets">${shops.map((s) => ticket(L, s, { heading: 'h2' })).join('')}</div></div></section>
</main>` + footer({ L }));

for (const s of shops) {
  page(`shop/${s.slug}/`, (L) => head({
    title: `${s.name}｜からあげ専門店 鶏好（${s.locality}）`,
    description: `からあげ専門店 鶏好 ${s.name}。${addressOf(s)}。電話 ${s.tel}。${s.delivery.length ? `${s.delivery.map((d) => d.name).join('・')}で宅配にも対応。` : 'テイクアウト・電話予約に対応。'}`,
    path: `shop/${s.slug}/`, L,
    jsonld: graph(webpageLD(`shop/${s.slug}/`, s.name, 'WebPage', { mainEntity: { '@id': shopId(s) } }), restaurantLD(s), crumbLD([['shop/', '店舗一覧'], [`shop/${s.slug}/`, s.name]])),
  }) + header({ L, current: 'shop/' }) + `
<main id="main">
${pageHero({ L, title: `鶏好 ${esc(s.name)}`, lead: esc(addressOf(s)), crumbs: [['shop/', '店舗一覧'], [`shop/${s.slug}/`, s.name]] })}
<section class="sec"><div class="wrap shopdetail">
  <div class="shopdetail__vis">${visual(L, { photo: s.photo, legacy: s.legacyPhoto, glaze: 'tare', layout: 'trio', seed: s.slug.length, alt: `鶏好 ${s.name}` })}</div>
  <div class="stack" style="gap:28px">
    <dl class="spec">
      <dt>住所</dt><dd>${esc(addressOf(s))}<br><a href="${mapUrl(s)}" target="_blank" rel="noopener">地図アプリで開く</a></dd>
      <dt>電話</dt><dd><a class="mono" href="${telHref(s.tel)}">${s.tel}</a> <button class="copy" type="button" data-copy="${s.tel}">コピー</button></dd>
      <dt>営業時間</dt><dd>${s.hours ? esc(s.hours) : '店舗へお電話でご確認ください'}</dd>
      <dt>定休日</dt><dd>${s.closed ? esc(s.closed) : '店舗へお電話でご確認ください'}</dd>
      <dt>ご注文方法</dt><dd>店頭・電話予約${s.delivery.length ? `・宅配（${s.delivery.map((d) => `<a href="${d.url}" target="_blank" rel="noopener">${esc(d.name)}</a>`).join('・')}）` : ''}</dd>
    </dl>
    ${s.note ? `<div class="callout"><strong>お知らせ</strong>${esc(s.note)}</div>` : ''}
    <p><a class="btn" href="${telHref(s.tel)}">${ICON.tel}${s.tel} に電話する</a></p>
  </div>
</div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec__head"><h2 class="h2">ほかの店舗</h2></div><div class="tickets">${shops.filter((o) => o !== s).map((o) => ticket(L, o)).join('')}</div></div></section>
</main>` + footer({ L }));
}

/* ---------- お知らせ ---------- */
page('news/', (L) => head({
  title: 'お知らせ｜からあげ専門店 鶏好',
  description: 'からあげ専門店 鶏好からのお知らせ一覧。吉塚店の移転（2025年12月）など、店舗の移転・オープン・閉店の情報を掲載しています。',
  path: 'news/', L,
  jsonld: graph(webpageLD('news/', 'お知らせ', 'CollectionPage'), crumbLD([['news/', 'お知らせ']])),
}) + header({ L, current: 'news/' }) + `
<main id="main">
${pageHero({ L, title: 'お知らせ', crumbs: [['news/', 'お知らせ']] })}
<section class="sec"><div class="wrap"><ul class="newslist">${news.map((n) => `<li><a href="${L(`news/${n.slug}/`)}"><time datetime="${n.date}">${n.date.replace(/-/g, '.')}</time><h2>${esc(n.title)}</h2><span aria-hidden="true">→</span></a></li>`).join('')}</ul></div></section>
</main>` + footer({ L }));

for (const n of news) {
  page(`news/${n.slug}/`, (L) => head({
    title: `${n.title}｜からあげ専門店 鶏好`,
    description: n.body.join('').slice(0, 110),
    path: `news/${encodeURIComponent(n.slug)}/`, L, ogType: 'article',
    jsonld: graph(
      webpageLD(`news/${encodeURIComponent(n.slug)}/`, n.title),
      { '@type': 'NewsArticle', headline: n.title, datePublished: n.date, dateModified: n.date, inLanguage: 'ja', author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, mainEntityOfPage: abs(`news/${encodeURIComponent(n.slug)}/`), image: abs(site.ogImage) },
      crumbLD([['news/', 'お知らせ'], [`news/${encodeURIComponent(n.slug)}/`, n.title]]),
    ),
  }) + header({ L, current: 'news/' }) + `
<main id="main">
${pageHero({ L, title: esc(n.title), lead: `<time class="mono" datetime="${n.date}">${n.date.replace(/-/g, '.')}</time>`, crumbs: [['news/', 'お知らせ'], [`news/${n.slug}/`, n.title]] })}
<section class="sec"><div class="wrap"><article class="prose">${n.body.map((p) => `<p>${esc(p)}</p>`).join('')}<p><a href="${L('news/')}">← お知らせ一覧へ</a></p></article></div></section>
</main>` + footer({ L }));
}

/* ---------- 採用 ---------- */
page('recruit/', (L) => head({
  title: '採用情報（正社員・店長候補）｜からあげ専門店 鶏好',
  description: `鶏好の採用情報。${recruit.title}。${recruit.salary.text}。未経験から店長・本部マネージャーへ。福岡県内の店舗で募集。`,
  path: 'recruit/', L,
  jsonld: graph(webpageLD('recruit/', '採用情報'), {
    '@type': 'JobPosting',
    title: `からあげ専門店 鶏好 ${recruit.title}`,
    description: `<p>${recruit.description}</p><p>${recruit.hours}。${recruit.holidays}。</p><p>待遇：${recruit.benefits.join('、')}。${recruit.probation}。</p>`,
    datePosted: recruit.datePosted,
    employmentType: 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: company.name, sameAs: site.url, logo: abs('assets/img/logo.png') },
    jobLocation: shops.map((s) => ({ '@type': 'Place', address: { '@type': 'PostalAddress', postalCode: s.postalCode, addressRegion: s.region, addressLocality: s.locality, streetAddress: s.street, addressCountry: 'JP' } })),
    baseSalary: { '@type': 'MonetaryAmount', currency: 'JPY', value: { '@type': 'QuantitativeValue', minValue: recruit.salary.min, maxValue: recruit.salary.max, unitText: 'MONTH' } },
    directApply: false,
  }, crumbLD([['recruit/', '採用情報']])),
}) + header({ L, current: 'recruit/' }) + `
<main id="main">
${pageHero({ L, title: '一緒に、揚げませんか。', lead: '鶏好の正社員を募集しています。最初は調理とカウンターから。店長、本部マネージャーへとステップアップできます。', crumbs: [['recruit/', '採用情報']] })}
<section class="sec"><div class="wrap stack">
  <dl class="spec">
    <dt>職種</dt><dd>${esc(recruit.title)}<br>${esc(recruit.description)}</dd>
    <dt>応募資格</dt><dd>${esc(recruit.eligibility)}</dd>
    <dt>勤務地</dt><dd>${esc(recruit.location)}（${shops.map((s) => s.name).join('・')}）</dd>
    <dt>給与</dt><dd>${esc(recruit.salary.text)}</dd>
    <dt>勤務時間</dt><dd>${esc(recruit.hours)}</dd>
    <dt>休日・休暇</dt><dd>${esc(recruit.holidays)}</dd>
    <dt>待遇</dt><dd>${recruit.benefits.map(esc).join('／')}</dd>
    <dt>試用期間</dt><dd>${esc(recruit.probation)}</dd>
    <dt>応募方法</dt><dd>${esc(recruit.apply)}<br><a class="mono" href="mailto:${site.emails.recruit}">${site.emails.recruit}</a></dd>
  </dl>
</div></section>
</main>` + footer({ L }));

/* ---------- フランチャイズ ---------- */
page('franchise/', (L) => head({
  title: 'フランチャイズ加盟のご案内｜からあげ専門店 鶏好',
  description: '鶏好のフランチャイズ加盟の流れ。お問い合わせから店舗見学・加盟申込み・立地開発・研修・オープンまで、直営店のノウハウでサポートします。',
  path: 'franchise/', L,
  jsonld: graph(webpageLD('franchise/', 'フランチャイズ情報'), {
    '@type': 'HowTo', name: '鶏好のフランチャイズに加盟するまでの流れ', step: franchiseSteps.map(([n, t], i) => ({ '@type': 'HowToStep', position: i + 1, name: n, text: t })),
  }, crumbLD([['franchise/', 'フランチャイズ情報']])),
}) + header({ L, current: 'franchise/' }) + `
<main id="main">
${pageHero({ L, title: 'あなたの街に、鶏好を。', lead: '直営店の運営で培ったノウハウをもとに、物件探しから開業後まで継続してサポートします。複数の不動産会社と連携し、物件情報や事業計画のご相談にも対応します。', crumbs: [['franchise/', 'フランチャイズ情報']] })}
<section class="sec"><div class="wrap stack">
  <div><div class="sec__head"><p class="eyebrow">Flow</p><h2 class="h2">加盟までの流れ</h2></div>
  <ol class="flow">${franchiseSteps.map(([n, t]) => `<li><h3>${esc(n)}</h3><p>${esc(t)}</p></li>`).join('')}</ol></div>
  <p><a class="btn" href="${L('contact-fc/')}">フランチャイズについて問い合わせる ${ICON.arrow}</a></p>
</div></section>
</main>` + footer({ L }));

/* ---------- お問い合わせ ---------- */
const contactPage = (path, { title, h1, lead, fc }) => page(path, (L) => head({
  title: `${title}｜からあげ専門店 鶏好`,
  description: fc ? '福岡のからあげテイクアウト専門店「鶏好」のフランチャイズ加盟に関するお問い合わせ・資料請求はこちら。担当者よりご連絡します。' : '福岡のからあげテイクアウト専門店「鶏好」へのお問い合わせフォーム。ご注文・ご予約は美和台本店・吉塚店・舞松原店・福津店へお電話ください。',
  path, L,
  jsonld: graph(webpageLD(path, title, 'ContactPage'), crumbLD([[path, title]])),
}) + header({ L }) + `
<main id="main">
${pageHero({ L, title: h1, lead, crumbs: [[path, title]] })}
<section class="sec"><div class="wrap stack">
  ${fc ? '' : `<div class="callout"><strong>ご注文・ご予約はお電話で</strong><ul class="tels">${shops.map((s) => `<li><span>${esc(s.name)}</span><a class="mono" href="${telHref(s.tel)}">${s.tel}</a></li>`).join('')}</ul></div>`}
  <form class="form" id="contact-form" data-mailto="${fc ? company.email : site.emails.general}" data-endpoint="" novalidate>
    <input type="hidden" name="type" value="${fc ? 'franchise' : 'general'}">
    <label for="f-name"><span class="lbl">お名前<span class="req">必須</span></span><input id="f-name" name="name" autocomplete="name" required></label>
    <label for="f-email"><span class="lbl">メールアドレス<span class="req">必須</span></span><input id="f-email" name="email" type="email" autocomplete="email" required></label>
    <label for="f-tel"><span class="lbl">お電話番号</span><input id="f-tel" name="tel" type="tel" autocomplete="tel"></label>
    <label for="f-msg"><span class="lbl">お問い合わせ内容<span class="req">必須</span></span><textarea id="f-msg" name="message" required></textarea></label>
    <p style="font-size:.85rem;color:var(--muted)">営業目的のメールは固くお断りしています。送信内容は<a href="${L('privacy-policy/')}">プライバシーポリシー</a>に沿って取り扱います。</p>
    <p><button class="btn" type="submit">送信する</button></p>
    <p class="msg" role="status" hidden></p>
  </form>
  ${fc ? '' : `<p><a href="${L('contact-fc/')}">フランチャイズに関するお問い合わせはこちら →</a></p>`}
</div></section>
</main>` + footer({ L }));
contactPage('contact/', { title: 'お問い合わせ', h1: 'お問い合わせ', lead: 'ご質問・ご意見はこちらのフォームからお送りください。' });
contactPage('contact-fc/', { title: 'フランチャイズのお問い合わせ', h1: 'フランチャイズのお問い合わせ', lead: '加盟に関するご質問・資料のご請求はこちらから。担当者よりご連絡します。', fc: true });

/* ---------- 会社概要 ---------- */
page('corporation/', (L) => head({
  title: `会社概要｜${company.name}（からあげ専門店 鶏好）`,
  description: `からあげ専門店 鶏好を運営する${company.name}の会社概要。所在地：福岡市博多区奈良屋町。`,
  path: 'corporation/', L,
  jsonld: graph(webpageLD('corporation/', '会社概要', 'AboutPage', { mainEntity: { '@id': ORG_ID } }), crumbLD([['corporation/', '会社概要']])),
}) + header({ L }) + `
<main id="main">
${pageHero({ L, title: '会社概要', lead: '鶏好を運営する会社の情報です。', crumbs: [['corporation/', '会社概要']] })}
<section class="sec"><div class="wrap">
  <dl class="spec">
    <dt>会社名</dt><dd>${esc(company.name)}（${company.nameKana}）</dd>
    <dt>所在地</dt><dd>〒${company.postalCode} ${company.region}${company.locality}${company.street}</dd>
    <dt>FAX</dt><dd class="mono">${company.fax}</dd>
    <dt>メール</dt><dd><a class="mono" href="mailto:${company.email}">${company.email}</a></dd>
    <dt>事業内容</dt><dd><ul style="margin:0;padding-left:1.2em">${company.business.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></dd>
  </dl>
</div></section>
</main>` + footer({ L }));

/* ---------- プライバシーポリシー ---------- */
page('privacy-policy/', (L) => head({
  title: 'プライバシーポリシー｜からあげ専門店 鶏好',
  description: 'からあげ専門店 鶏好（toriyoshi.love）のプライバシーポリシー。お問い合わせでいただく個人情報の利用目的・第三者提供・開示請求について。',
  path: 'privacy-policy/', L,
  jsonld: graph(webpageLD('privacy-policy/', 'プライバシーポリシー'), crumbLD([['privacy-policy/', 'プライバシーポリシー']])),
}) + header({ L }) + `
<main id="main">
${pageHero({ L, title: 'プライバシーポリシー', crumbs: [['privacy-policy/', 'プライバシーポリシー']] })}
<section class="sec"><div class="wrap prose">
  <h2>個人情報について</h2>
  <p>個人情報とは、生存する個人に関する情報で、メールアドレス・電話番号などのほか、趣味・家族構成・年齢などの属性情報であって、特定の個人と結びついているものをいいます。</p>
  <h2>お問い合わせでいただく情報</h2>
  <p>お問い合わせの際にご提供いただくお名前・メールアドレスなどは、ご質問への回答や必要な情報のご案内のためだけに使用し、それ以外の目的では使用しません。</p>
  <h2>第三者への提供</h2>
  <p>お預かりした個人情報は、次の場合を除き第三者に提供しません。</p>
  <ul><li>ご本人の同意がある場合</li><li>法令に基づく場合</li><li>人の生命・身体・財産の保護のために必要で、ご本人の同意を得ることが難しい場合</li><li>警察・検察・裁判所・消費生活センターなど公的機関から要請があった場合</li><li>個人情報の安全管理のために必要な場合</li></ul>
  <h2>安全管理</h2>
  <p>個人情報を正確かつ安全に保つため、適切な安全対策を講じます。</p>
  <h2>開示・訂正・削除のご請求</h2>
  <p>ご本人から個人情報の開示・訂正・追加・削除・利用停止のご請求があった場合は、ご本人であることを確認したうえで速やかに対応します。<a href="${L('contact/')}">お問い合わせ</a>からご連絡ください。</p>
  <p class="mono" style="font-size:.8rem;color:var(--muted)">制定日：2020年10月15日</p>
</div></section>
</main>` + footer({ L }));

/* ---------- HTML サイトマップ / 404 ---------- */
page('sitemap/', (L) => head({
  title: 'サイトマップ｜からあげ専門店 鶏好', description: 'からあげ専門店 鶏好のサイトマップ。メニュー・店舗一覧・お知らせ・採用情報・フランチャイズ情報など全ページの一覧です。', path: 'sitemap/', L,
  jsonld: graph(webpageLD('sitemap/', 'サイトマップ'), crumbLD([['sitemap/', 'サイトマップ']])),
}) + header({ L }) + `
<main id="main">
${pageHero({ L, title: 'サイトマップ', crumbs: [['sitemap/', 'サイトマップ']] })}
<section class="sec"><div class="wrap prose"><ul>
  <li><a href="${L('/')}">ホーム</a></li>
  <li><a href="${L('menu/')}">メニュー</a><ul><li><a href="${L('allergies/')}">アレルギー表示</a></li></ul></li>
  <li><a href="${L('shop/')}">店舗一覧</a><ul>${shops.map((s) => `<li><a href="${L(`shop/${s.slug}/`)}">${esc(s.name)}</a></li>`).join('')}</ul></li>
  <li><a href="${L('news/')}">お知らせ</a><ul>${news.map((n) => `<li><a href="${L(`news/${n.slug}/`)}">${esc(n.title)}</a></li>`).join('')}</ul></li>
  <li><a href="${L('recruit/')}">採用情報</a></li>
  <li><a href="${L('franchise/')}">フランチャイズ情報</a></li>
  <li><a href="${L('contact/')}">お問い合わせ</a>・<a href="${L('contact-fc/')}">フランチャイズのお問い合わせ</a></li>
  <li><a href="${L('corporation/')}">会社概要</a></li>
  <li><a href="${L('privacy-policy/')}">プライバシーポリシー</a></li>
</ul></div></section>
</main>` + footer({ L }));

page('404.html', (L) => head({ title: 'ページが見つかりません｜からあげ専門店 鶏好', description: 'お探しのページは見つかりませんでした。', path: '404.html', L, noindex: true, jsonld: graph() }) + header({ L }) + `
<main id="main">
${pageHero({ L, title: 'このページは揚がっていません。', lead: 'お探しのページは移動したか、削除された可能性があります。', crumbs: [['404.html', '404']] })}
<section class="sec"><div class="wrap"><p><a class="btn" href="${L('/')}">ホームへ戻る</a> <a class="btn btn--ghost" href="${L('shop/')}">店舗一覧</a></p></div></section>
</main>` + footer({ L }));

/* ---------- 出力 ---------- */
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp('src/assets', join(OUT, 'assets'), { recursive: true });
if (!PREVIEW) await cp('src/static', OUT, { recursive: true }); // .htaccess など、サーバーにそのまま置くファイル
// CSS を軽く圧縮。main.css は各ページの <style> にインライン化（描画をブロックしない）、
// フォント定義は非同期で読み込む。
const minify = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s*([{};,>])\s*/g, '$1').replace(/:\s+/g, ':').replace(/;}/g, '}');
const MAIN_CSS = minify(await readFile('src/assets/css/main.css', 'utf8'));
await writeFile(join(OUT, 'assets/css/main.css'), MAIN_CSS);
if (existsSync('src/assets/css/fonts.css')) await writeFile(join(OUT, 'assets/css/fonts.css'), minify(await readFile('src/assets/css/fonts.css', 'utf8')));
globalThis.__MAIN_CSS__ = MAIN_CSS;

for (const p of pages) {
  const L = linker(p.path === '/' ? '' : p.path, { preview: PREVIEW });
  const html = p.render(L);
  const file = p.path === '/' ? 'index.html' : p.path.endsWith('/') ? join(p.path, 'index.html') : p.path;
  await mkdir(join(OUT, dirname(file)), { recursive: true });
  // Artifact プレビューではトップページを本文だけにする（ホスト側が html/head/body を付けるため）
  const out = PREVIEW && file === 'index.html'
    ? html.replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*<head>/i, '').replace(/<\/head>\s*<body>/i, '').replace(/<\/body>\s*<\/html>\s*$/i, '').replace(/<title>[^<]*<\/title>/, '<title>鶏好 サイトリニューアル</title>')
    : html;
  await writeFile(join(OUT, file), out);
}

// sitemap.xml（URL はパーセントエンコード）
const urls = pages.filter((p) => p.path !== '404.html').map((p) => abs(p.path === '/' ? '' : p.path.split('/').map(encodeURIComponent).join('/')));
await writeFile(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}
</urlset>
`);

await writeFile(join(OUT, 'robots.txt'), `# 検索エンジン・AIアシスタントのクロールを歓迎します
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${site.url}/sitemap.xml
`);

// llms.txt（要約）と llms-full.txt（全文）
const shopMd = (s) => `- **${s.name}**：${addressOf(s)}／電話 ${s.tel}／${s.delivery.length ? `宅配：${s.delivery.map((d) => `[${d.name}](${d.url})`).join('、')}` : 'テイクアウト・電話予約'}／[店舗ページ](${abs(`shop/${s.slug}/`)})`;
const llms = `# からあげ専門店 鶏好（とりよし / Toriyoshi）

> 福岡のからあげテイクアウト専門店。特製の漬けダレで長時間熟成させた骨なしもも肉のからあげを、7種類の味で提供しています。電話予約・宅配（Uber Eats・Wolt・出前館、一部店舗）に対応。福岡市東区に3店舗、福津市に1店舗。運営：${company.name}。

キャッチコピー：「${site.tagline}」「食卓に幸福を・食卓に笑顔を・食卓に愛を」

## 基本情報
- 業態：お持ち帰り（テイクアウト）専門のからあげ店。店内飲食はありません。
- 注文方法：店頭、各店舗への電話予約、宅配アプリ（吉塚店：Uber Eats・Wolt・出前館／福津店：Uber Eats）
- 看板商品：骨なしもも肉 6〜7個（250g以上）。味は たれ（一番人気）・たれコショー・たれ一味・たれにんにく・韓辛にんにく・塩・ポン酢 の7種類
- そのほか：むね肉、手羽先（塩・名古屋風）、身付き軟骨、串（砂ずり・素揚げ砂ずり・ぼんじり・はつ・手羽先）、からあげ弁当（小盛・大盛・特盛）、からあげ盛り合わせ（3人前・5人前、要予約）
- 価格・営業時間・定休日：各店舗へお電話でご確認ください（サイト上では未掲載）

## 店舗
${shops.map(shopMd).join('\n')}

## 主なページ
- [メニュー](${abs('menu/')})：全メニューと7種類の味
- [店舗一覧](${abs('shop/')})：住所・電話番号・宅配
- [お知らせ](${abs('news/')})：移転・開店・閉店情報
- [採用情報](${abs('recruit/')})：正社員（店長候補）募集
- [フランチャイズ情報](${abs('franchise/')})：加盟の流れ
- [会社概要](${abs('corporation/')})

## Optional
- [全文（llms-full.txt）](${abs('llms-full.txt')})
- [よくあるご質問](${abs('#faq')})
`;
await writeFile(join(OUT, 'llms.txt'), llms);

const llmsFull = `${llms}
---

# 詳細

## こだわり
${steps.map((s) => `### ${s.n} ${s.title}（${s.en}）\n${s.text}`).join('\n\n')}

## もも肉の7つの味
${flavors.map((f) => `- **${f.name}**${f.badge ? `（${f.badge}）` : ''}：${f.copy}`).join('\n')}

## メニュー
${menu.map((m) => `### ${m.name}\n${[m.spec, m.desc, m.options ? `選べる：${m.options.join('・')}` : '', m.reservation ? '要予約' : ''].filter(Boolean).join('\n')}`).join('\n\n')}

注意事項：
${menuNotes.map((n) => `- ${n}`).join('\n')}

## よくあるご質問
${faqs.map((f) => `### Q. ${f.q}\nA. ${f.a}`).join('\n\n')}

## お知らせ
${news.map((n) => `### ${n.date} ${n.title}\n${n.body.join('\n')}`).join('\n\n')}

## 採用情報
- 職種：${recruit.title}
- 内容：${recruit.description}
- 応募資格：${recruit.eligibility}
- 給与：${recruit.salary.text}
- 勤務時間：${recruit.hours}
- 休日：${recruit.holidays}
- 待遇：${recruit.benefits.join('、')}
- 応募：${recruit.apply} ${site.emails.recruit}

## フランチャイズ加盟の流れ
${franchiseSteps.map(([n, t], i) => `${i + 1}. **${n}**：${t}`).join('\n')}

## 会社概要
- 会社名：${company.name}（${company.nameKana}）
- 所在地：〒${company.postalCode} ${company.region}${company.locality}${company.street}
- FAX：${company.fax}
- メール：${company.email}
- 事業内容：${company.business.join('、')}
`;
await writeFile(join(OUT, 'llms-full.txt'), llmsFull);

await writeFile(join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: 'からあげ専門店 鶏好', short_name: '鶏好', lang: 'ja', start_url: '/', display: 'standalone', background_color: '#FFFBF2', theme_color: site.themeColor,
  icons: [{ src: '/assets/img/favicon.svg', sizes: 'any', type: 'image/svg+xml' }, { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));

console.log(`built ${pages.length} pages → ${OUT}/`);
