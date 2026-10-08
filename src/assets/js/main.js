import { renderPile, Sizzle } from './karaage.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 60));

/* ヘッダー: スクロールで背景を敷く */
const hdr = $('.hdr');
if (hdr) {
  const onScroll = () => hdr.classList.toggle('is-solid', scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
}

/* モバイルメニュー */
const burger = $('.burger');
const drawer = $('#drawer');
if (burger && drawer) {
  const set = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    drawer.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', drawer)?.focus();
  };
  burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
  $('.close', drawer)?.addEventListener('click', () => { set(false); burger.focus(); });
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) { set(false); burger.focus(); } });
}

// ページ単位の初期化。プレビューのページ切り替え時にも呼び直せるよう、
// 前回分のリスナー・タイマーは AbortController でまとめて片付ける。
let pageCtl = null;
export function initPage() {
  pageCtl?.abort();
  pageCtl = new AbortController();
  const signal = pageCtl.signal;

  /* 縦書きコピー: 幸福 → 笑顔 → 愛 */
  const flip = $('.hero__tate .flip');
  if (flip && !reduce) {
    const words = JSON.parse(flip.dataset.words || '[]');
    let i = 0;
    const timer = setInterval(() => {
      flip.classList.add('out');
      setTimeout(() => {
        i = (i + 1) % words.length;
        flip.firstElementChild.textContent = words[i];
        flip.classList.remove('out');
      }, 450);
    }, 2600);
    signal.addEventListener('abort', () => clearInterval(timer));
  }

  /* ヒーロー: からあげの山 + 湯気 + タップで「ジュワッ」 */
  const pile = $('.hero__pile');
  if (pile) {
    const base = $('img.base', pile), fx = $('canvas.fx', pile);
    idle(async () => {
      await base.decode().catch(() => {});
      pile.classList.add('is-ready');
      const sz = new Sizzle(fx, { source: { glints: [] }, density: 1.1, steamFrom: [0.25, 0.75, 0.48], offsetY: fx.clientHeight - base.clientHeight });
      if (signal.aborted) return;
      sz.start();
      signal.addEventListener('abort', () => sz.stop());
      if (!reduce) sz.draw(performance.now());
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? sz.start() : sz.stop()));
      io.observe(pile);
      const words = ['ジュワッ', 'サクッ', 'カリッ', 'じゅわ〜'];
      let k = 0;
      const hit = (x, y) => {
        sz.burst(x, y + sz.offsetY);
        if (reduce) return;
        const el = document.createElement('span');
        el.className = 'onomato';
        el.textContent = words[k++ % words.length];
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty('--r', `${(Math.random() * 16 - 8).toFixed(1)}deg`);
        pile.appendChild(el);
        setTimeout(() => el.remove(), 1200);
      };
      pile.addEventListener('pointerdown', (e) => {
        const r = pile.getBoundingClientRect();
        hit(e.clientX - r.left, e.clientY - r.top);
      });
      pile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(pile.clientWidth / 2, pile.clientHeight / 2); }
      });
      let t;
      addEventListener('resize', () => {
        clearTimeout(t);
        t = setTimeout(() => { sz.resize(); sz.offsetY = fx.clientHeight - base.clientHeight; }, 200);
      }, { signal });
    });
  }

  /* フレーバーラボ */
  const lab = $('#flavors');
  if (lab) {
    const photo = $('.lab__photo', lab);
    const big = $('.lab__big', lab);
    const count = $('.lab__count', lab);
    const tabs = $$('[role="tab"]', lab);
    let current = -1;
    const select = (i, focus) => {
      if (i === current) return;
      current = i;
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(i === j));
        t.tabIndex = i === j ? 0 : -1;
      });
      if (focus) tabs[i].focus();
      const tab = tabs[i];
      big.textContent = tab.dataset.name;
      count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(tabs.length).padStart(2, '0')}`;
      photo.classList.add('swap');
      setTimeout(() => {
        photo.src = tab.dataset.photo;
        photo.alt = `${tab.dataset.name}のからあげ`;
        photo.decode().catch(() => {}).then(() => photo.classList.remove('swap'));
      }, reduce ? 0 : 220);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    const io = new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); idle(() => select(0)); } }, { rootMargin: '300px' });
    io.observe(lab);
  }

  /* メニュー・店舗の手続き生成ビジュアル（写真がない枠だけ） */
  const vis = $$('canvas[data-glaze]');
  if (vis.length) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const c = e.target;
        idle(() => renderPile(c, { glaze: c.dataset.glaze, layout: c.dataset.layout || 'trio', seed: +c.dataset.seed || 1 }));
      }
    }, { rootMargin: '400px' });
    vis.forEach((c) => io.observe(c));
  }

  /* 写真の読み込みに失敗したら手続き生成に任せる */
  $$('img[data-fallback]').forEach((img) => {
    const fail = () => img.remove();
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener('error', fail);
  });

  /* 地図のピンと店舗カードを連動 */
  $$('[data-shop]').forEach((el) => {
    const slug = el.dataset.shop;
    const pin = document.getElementById(`pin-${slug}`);
    if (!pin) return;
    const on = () => pin.classList.add('is-on');
    const off = () => pin.classList.remove('is-on');
    el.addEventListener('pointerenter', on);
    el.addEventListener('pointerleave', off);
    el.addEventListener('focusin', on);
    el.addEventListener('focusout', off);
  });

  /* 電話番号コピー */
  $$('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const txt = b.dataset.copy;
      try { await navigator.clipboard.writeText(txt); b.textContent = 'コピーしました'; }
      catch { const r = document.createRange(); const t = b.previousElementSibling; if (t) { r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } b.textContent = '選択しました'; }
      setTimeout(() => (b.textContent = 'コピー'), 1800);
    });
  });

  /* スクロールで出てくる要素（最初から見えている要素は動かさない） */
  if (!reduce && 'IntersectionObserver' in window) {
    const els = $$('.rv').filter((el) => el.getBoundingClientRect().top > innerHeight * 0.92);
    els.forEach((el) => el.classList.add('pre'));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* お問い合わせフォーム: data-endpoint があれば送信、なければメールアプリで下書き */
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('.msg', form);
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      const ep = form.dataset.endpoint;
      if (ep) {
        try {
          const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error(String(res.status));
          msg.textContent = '送信しました。担当者より折り返しご連絡します。';
          form.reset();
        } catch {
          msg.textContent = '送信できませんでした。通信状況をご確認のうえ、もう一度お試しいただくか、メールでお問い合わせください。';
        }
        msg.hidden = false;
        return;
      }
      const body = `お名前: ${data.name}\nメールアドレス: ${data.email}\nお電話番号: ${data.tel || ''}\n\n${data.message}`;
      location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent('【鶏好】お問い合わせ')}&body=${encodeURIComponent(body)}`;
      msg.textContent = `メールアプリが開かない場合は ${form.dataset.mailto} まで直接お送りください。`;
      msg.hidden = false;
    });
  }
}

initPage();
window.__toriyoshiInitPage = initPage;
