# 引き継ぎ資料 — 鶏好 公式サイト（toriyoshi.love）

最終更新: 2026-10-14
この資料だけで、次に作業する人（または AI エージェント）がサイトの状態を把握できるように書いています。変更を加えたら、このファイルの該当箇所と「変更履歴」も更新してください。

---

## 1. 現在の状態（ひと目で）

| 項目 | 状態 |
| --- | --- |
| 本番サイト | https://toriyoshi.love/ — 2026-10-11 に新サイトへ切り替え済み。全 20 ページの表示をオーナーが確認 |
| 本番の中身 | コミット `fa9c9d7`（ブランチ `claude/project-thread-nq0va1`）を `node build.mjs` でビルドしたもの。2026-10-14 にアップロード済み zip と再ビルド結果を比較し、ビルド日付以外は一致することを確認 |
| サーバー | さくらのレンタルサーバ。toriyoshi.love の公開フォルダは `~/www/wp` |
| 確認用サイト | https://sanhyokim.github.io/toriyosi_new/ （`gh-pages` ブランチ、全ページ noindex） |
| 検索エンジン | Google Search Console に URL プレフィックス `https://toriyoshi.love/` で登録済み、`sitemap.xml` 送信済み（2026-10-11） |
| 未確定の情報 | 営業時間・定休日、価格、アレルゲン、フォーム送信先、採用の郵送先、吉塚店の Uber Eats URL（→ 7 章） |

---

## 2. ブランチと PR

| ブランチ | 中身 |
| --- | --- |
| `main` | 長らく初期コミットだけだった。この資料を含む PR をマージすると、本番と同じコード＋資料になる |
| `renewal` | リニューアル初版（3 コミット）。PR #1（→ main、ドラフト）の元 |
| `claude/project-thread-nq0va1` | `renewal` の続き。旧サイト写真の取り込み以降、本番公開版 `fa9c9d7` まで。PR #2（→ renewal） |
| `gh-pages` | 確認用サイトのビルド結果だけを置くブランチ。手で編集しない（→ 5 章） |

**今後は `main` を正とする。** 新しい作業は `main` から枝分かれさせ、`main` に PR を出してください。

---

## 3. 経緯

| 日付 | 出来事 |
| --- | --- |
| 2026-10-08 | オーナーが WordPress サイトの完全リニューアルを依頼。目標は「Awwwards / Webby / FWA で賞を狙える品質」と「SEO・AI SEO への対応」。依存なしの静的サイトとして全 21 ページ（404 含む）を実装。Lighthouse（モバイル）Performance 95 / その他 100 |
| 2026-10-08 | ホスティングはオーナーが「今のサーバー（WordPress の Apache）」を選択。Cloudflare Pages 等は使わない。`.htaccess` を追加 |
| 2026-10-08 | 旧サイトの写真 16 枚を取り込み、WebP 化して `src/assets/photos/` に同梱 |
| 2026-10-08 | 店舗地図: 緯度経度の格子図 → JR 路線入りの手描き図、をオーナーが 2 回却下。**Google マップ埋め込み**（店舗タブで切替）に決定 |
| 2026-10-08 | 「もも、7つの味」は写真がないため、写真なしの演出（味名の文字アニメーション・味ごとの光の色・薬味が降る）にする |
| 2026-10-11 | 写真の読み込み中に仮イラストが見える問題を修正、写真を WebP で約 1.9MB → 約 1MB に軽量化 |
| 2026-10-11 | 確認用サイトとして GitHub Pages を有効化（第三者チェック用） |
| 2026-10-11 | トップの「鶏好」で細い代替フォントが一瞬見える問題を修正 |
| 2026-10-11 | ロゴをお店支給の筆文字ロゴに差し替え。Wolt は営業終了のため全ページから削除。吉塚店 Uber Eats は旧リンクが切れていたため暫定で検索 URL |
| 2026-10-11 | ヒーロー・各ページ見出しの面を黄色からコーポレートカラーの臙脂 `#4C1A2C` に変更 |
| 2026-10-11 | トップ写真をからあげ弁当（背景透過）に変更。タップ演出を場所で分ける（からあげ: ジュワッ・サクッ／ご飯: ホカホカ・ふっくら＋湯気／漬物: カリッ のみ） |
| 2026-10-11 | **本番公開**。旧 WordPress は `~/www/wp/_wp_old` に退避、DB はエクスポート済み。Search Console 登録・sitemap 送信 |

---

## 4. 決定事項（変えるときはオーナーに確認）

- **ホスティング**: さくらのレンタルサーバ（Apache）に静的ファイルを置く。ビルドの自動デプロイはない
- **URL**: 旧 WordPress の URL を維持（`/menu/` `/shop/` `/news/{slug}/` `/recruit/` `/franchise/` `/corporation/` `/privacy-policy/` `/allergies/` `/contact/` `/contact-fc/` `/sitemap/`）。店舗詳細 `/shop/{slug}/` は新設。WordPress 時代の `/feed/` `/category/…` `/YYYY/MM/…` `?p=` は `.htaccess` で `/news/` などへ 301
- **地図**: Google マップの埋め込み。手描き地図は作らない
- **色**: 臙脂 `#4C1A2C`（`--en`）が面の色。臙脂の上の本文は生成り `#F6E7CF`（`--en-ink`）、大見出しは砂色 `#E6C597`（`--en-sand`）。差し色に揚げ色ゴールド（`--gold`）
- **ロゴ**: お店支給の筆文字ロゴ（`src/assets/img/logo.png` `logo-white.png` `logo-mark.webp`、アイコン類も同じロゴから作成）。ヘッダーはロゴ＋「鶏好 からあげ専門店」の文字の併記でオーナー了承済み
- **書体**: Dela Gothic One（見出し）、Zen Kaku Gothic New（本文）、Martian Mono（英数字の飾り）。使う文字だけのサブセットを `src/assets/fonts/` にセルフホスト。**文言を変えたら `npm run fonts`**（含まれない文字はシステムフォントで表示される）
- **宅配**: Uber Eats と出前館のみ。Wolt は削除済み
- **7つの味**: 写真は使わない演出（オーナーの指示）
- **SEO / AI SEO**: 構造化データ（Organization / WebSite / 店舗ごとの Restaurant / Menu / FAQPage / NewsArticle / JobPosting / HowTo / BreadcrumbList）、`llms.txt`・`llms-full.txt`、AI クローラーを許可した `robots.txt`、`sitemap.xml`。いずれも `build.mjs` が `src/data.mjs` から生成する
- **採用の応募先**: 旧サイトの郵送先が閉店済みの井尻駅前店だったため、メールのみ掲載

---

## 5. 本番・確認用の構成

### 本番サーバー（さくらのレンタルサーバ）

```
~/www/                     ← 初期ドメイン toriyoshi-love.sakura.ne.jp の公開フォルダ
~/www/wp/                  ← toriyoshi.love の公開フォルダ（ここが本番）
  index.html .htaccess …   ← 新サイト（dist/ の中身）
  wp-content/              ← 旧 WordPress の写真など。消さない
  _wp_old/                 ← 退避した旧 WordPress 本体（wp-admin, wp-includes, wp-*.php, 旧 .htaccess など）。巻き戻し用
  google*.html             ← Search Console の所有確認ファイル。消さない
```

- 同じサーバーに**別サイト radiant-me.love** と、その専用データベースがある。触らないこと
- 旧 WordPress のデータベースは公開作業の前にエクスポート済み（ファイルはオーナーの手元）。データベース自体はサーバーに残っている
- 管理はさくらのコントロールパネル（https://secure.sakura.ad.jp/rs/cp/ ）→「Webサイト/データ」→「ファイルマネージャー」。作業環境から FTP 等で直接触る手段は用意していない（認証情報もリポジトリに置かない）
- `wp-content/` について: 当初は新サイトが写真を `/wp-content/uploads/…` から読む設計だったが、その後写真を `src/assets/photos/` に同梱したため、**2026-10-14 時点の本番ビルドは `wp-content` を参照していない**（`build.mjs` の `legacyPhoto` は、同梱写真が無いときの予備）。それでも、検索エンジンに登録済みの旧画像 URL と巻き戻しのために残しておく

### `.htaccess`（`src/static/.htaccess`）

HTTPS と www なしへの統一、末尾スラッシュの統一、WordPress 時代の URL のリダイレクト、`wp-login.php` / `xmlrpc.php` を 410、圧縮・キャッシュ・セキュリティヘッダー。モジュールが無いサーバーでも壊れないよう `<IfModule>` で囲んである。

### 確認用サイト（GitHub Pages）

- https://sanhyokim.github.io/toriyosi_new/ 。Pages の設定は「Deploy from a branch」→ `gh-pages` / `(root)`
- 中身は `node build.mjs --staging` の `dist/` から **`.htaccess` を除いたもの**。全ページ `noindex, nofollow`、`robots.txt` で全拒否、`.nojekyll` あり
- サイト内リンクは相対パスなので `/toriyosi_new/` 配下でも動く
- 更新手順（コミットメッセージは `確認用サイト（<元コミット> から生成）` で統一）:

```bash
node build.mjs --staging && rm dist/.htaccess
git fetch origin gh-pages
git worktree add ../ghp origin/gh-pages
rsync -a --delete --exclude .git dist/ ../ghp/
cd ../ghp && git add -A && git commit -m "確認用サイト（$(git -C ../toriyosi_new rev-parse --short HEAD) から生成）"
git push origin HEAD:gh-pages
cd - && git worktree remove ../ghp
```

### Artifact プレビュー（claude.ai）

`node build.mjs --preview` の `preview/` を claude.ai の Artifact として公開していた（https://claude.ai/artifact/89VdzGEfQTbBr3cbZ8MXoZ ）。Artifact の中では別ページへ移動できないため、`src/preview/preview-router.js` がリンクを押したときに `<main>` を差し替える。Google マップの iframe はプレビューでは表示できないので、代わりに地図リンクを出す。本番ビルドには含まれない。

---

## 6. 本番の更新・巻き戻し

- 更新: `npm run check` → `node build.mjs` → `dist/` の中身を zip（`.htaccess` を含む）→ オーナーがファイルマネージャーで `~/www/wp` に上書き。詳しい画面操作は [DEPLOY-sakura.md](DEPLOY-sakura.md)
- 消えたページがある場合（例: お知らせの削除）は、上書きでは古いフォルダが残るので、そのフォルダをファイルマネージャーで削除してもらう
- 巻き戻し（WordPress に戻す）: [DEPLOY-sakura.md](DEPLOY-sakura.md) の「元に戻したいとき」

---

## 7. 未確定・オーナー確認待ち

いずれもサイト上では「店舗へお電話でご確認ください」などの表示で逃がしている。分かったら `src/data.mjs` を埋めるだけで、全ページと構造化データに反映される。

| 項目 | 場所 | 現状 |
| --- | --- | --- |
| 各店舗の営業時間・定休日 | `shops[].hours` / `shops[].closed` | `null` |
| 価格 | `menu[].price` | `null` |
| アレルゲン | `/allergies/` | 旧サイトは動画のみで、文字情報なし |
| お問い合わせフォームの送信先 | `build.mjs` の `data-endpoint` | 空。空のあいだはメールアプリで下書きを開く（宛先 `site.emails` / `company.email`） |
| 採用の郵送先 | `recruit` | メールのみ掲載 |
| 吉塚店の Uber Eats URL | `shops`（吉塚店）`delivery` | 暫定で Uber Eats の「鶏好」検索 URL。オーナーにアプリの「共有」リンクを依頼中 |
| 「たれコショー」「たれ一味」の写真 | — | 無し（7つの味は写真なし演出のため現状は不要） |

---

## 8. 作業環境の注意

- このリポジトリの作業環境（クラウド）からは、`toriyoshi.love` や Google マップ等への通信が許可されていない場合がある。旧サイトの写真取得は `toriyoshi.love` を許可した環境で行った（`scripts/fetch-legacy-photos.mjs`）
- `npm run fonts` は Google Fonts、`npm run images` は Playwright（Chromium）を使う
- `scripts/check.mjs` は h1・title・description・canonical・JSON-LD・内部リンク・alt・lang を検査する。404 ページの description が短いという警告 1 件は既知で問題なし

---

## 変更履歴

| 日付 | 内容 |
| --- | --- |
| 2026-10-14 | この資料と CLAUDE.md を作成 |
