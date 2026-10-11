// Artifact プレビュー専用。プレビューの枠の中では別ページへの移動ができないため、
// サイト内リンクを押したら対象ページの <main> を読み込んで差し替える。本番サイトには含めない。
const root = new URL('index.html', document.baseURI);
let current = root;

const isInternal = (url) => url.origin === root.origin && url.pathname.startsWith(new URL('.', root).pathname);
const pagePath = (url) => (url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname);

function scrollToHash(hash) {
  const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  else scrollTo(0, 0);
}

async function go(url) {
  if (pagePath(url) === pagePath(current)) { scrollToHash(url.hash); return; }
  const target = new URL(url); target.hash = '';
  let html;
  try {
    const res = await fetch(target);
    if (!res.ok) throw new Error(String(res.status));
    html = await res.text();
  } catch {
    return;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const next = doc.querySelector('main');
  if (!next) return;
  // 読み込んだページのリンク・画像を、そのページの場所を基準にした絶対URLへ
  next.querySelectorAll('[href],[src]').forEach((el) => {
    for (const attr of ['href', 'src']) {
      const v = el.getAttribute(attr);
      if (!v || /^(#|mailto:|tel:|data:|https?:)/.test(v)) continue;
      el.setAttribute(attr, new URL(v, target).href);
    }
  });
  document.querySelector('main').replaceWith(document.importNode(next, true));
  document.title = doc.title;
  const cur = pagePath(target).replace(pagePath(root).replace(/index\.html$/, ''), '').split('/')[0];
  document.querySelectorAll('.nav__list a').forEach((a) => {
    const seg = pagePath(new URL(a.getAttribute('href'), document.baseURI)).replace(pagePath(root).replace(/index\.html$/, ''), '').split('/')[0];
    if (seg && seg === cur && seg !== 'index.html') a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  current = target;
  window.__toriyoshiInitPage?.();
  if (url.hash) requestAnimationFrame(() => scrollToHash(url.hash));
  else scrollTo(0, 0);
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank') return;
  const href = a.getAttribute('href');
  if (/^(mailto:|tel:)/.test(href)) return;
  if (href.startsWith('#')) {
    e.preventDefault();
    scrollToHash(href);
    return;
  }
  const url = new URL(href, document.baseURI);
  if (!isInternal(url)) return;
  e.preventDefault();
  go(url);
});
